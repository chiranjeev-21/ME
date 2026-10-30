const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const load = import(pathToFileURL(path.join(root, 'src', 'universe', 'content.ts')).href);
const emptyFeed = {
  source: 'github',
  selection: 'pinned',
  profile: { login: 'chiranjeev-21', url: 'https://github.com/chiranjeev-21' },
  items: [],
};
const repository = (overrides = {}) => ({
  id: 'public-1',
  name: 'Search Garden',
  description: 'Public description, and nothing more.',
  url: 'https://github.com/chiranjeev-21/search-garden',
  homepageUrl: 'https://example.com/garden',
  primaryLanguage: { name: 'TypeScript' },
  stargazerCount: 3,
  forkCount: 1,
  updatedAt: '2026-01-01T00:00:00Z',
  topics: ['rag', 'react'],
  ...overrides,
});

test('repository entries have safe, unique slugs and deduplicate curated work and repeated repositories', async () => {
  const { buildUniverseContent } = await load;
  const items = [
    repository(),
    repository(),
    repository({
      id: 'collision',
      name: 'Search—Garden',
      url: 'https://github.com/chiranjeev-21/other',
    }),
    repository({ id: 'unicode', name: '绘画', url: 'https://github.com/chiranjeev-21/art' }),
    repository({ id: 'unicode-2', name: '画', url: 'https://github.com/chiranjeev-21/art-2' }),
    repository({
      id: 'curated-name',
      name: 'CJ OS',
      url: 'https://github.com/chiranjeev-21/cj-os',
    }),
    repository({ id: 'portfolio', name: 'ME', url: 'https://github.com/chiranjeev-21/ME' }),
    repository({
      id: 'portfolio-alias',
      name: 'Portfolio under another title',
      url: 'https://github.com/chiranjeev-21/ME',
    }),
    repository({
      id: 'artifact',
      name: 'Real-Time Face-Mask Detection',
      url: 'https://example.com/research',
    }),
  ];
  const projects = buildUniverseContent({ ...emptyFeed, items }).projects;
  assert.equal(new Set(projects.map(project => project.slug)).size, projects.length);
  assert.equal(new Set(projects.map(project => project.id)).size, projects.length);
  assert.ok(projects.every(project => /^[a-z0-9][a-z0-9-]{0,100}$/.test(project.slug)));
  assert.equal(projects.filter(project => project.title === 'Search Garden').length, 1);
  assert.equal(projects.filter(project => project.title === 'CJ OS').length, 1);
  assert.equal(
    projects.filter(project => project.title === 'Real-Time Face-Mask Detection').length,
    1
  );
  assert.ok(!projects.some(project => project.title === 'ME'));
  assert.ok(!projects.some(project => project.id === 'github-portfolio-alias'));
  assert.ok(projects.some(project => project.title === '绘画'));
  assert.ok(projects.some(project => project.title === '画'));
  assert.ok(projects.some(project => project.slug === 'repo-search-garden-2'));
  assert.ok(projects.some(project => project.slug === 'repo-project-2'));
});

test('dynamic project detail stays within public metadata and preserves pinned / recent provenance', async () => {
  const { buildUniverseContent } = await load;
  for (const selection of ['pinned', 'recent']) {
    const item = repository();
    const project = buildUniverseContent({ ...emptyFeed, selection, items: [item] }).projects.find(
      project => project.source === 'github'
    );
    assert.equal(project.title, item.name);
    assert.equal(project.summary, item.description);
    assert.equal(project.sourceUrl, item.url);
    assert.equal(project.demoUrl, item.homepageUrl);
    assert.match(
      project.provenance,
      selection === 'pinned' ? /Pinned public repository/ : /Recent public repository/
    );
    assert.deepEqual(project.categories, ['AI/ML', 'Web']);
    assert.deepEqual(project.technologies, ['TypeScript', 'rag', 'react']);
    assert.equal(project.problem, '');
    for (const section of ['constraints', 'architecture', 'decisions', 'tradeoffs', 'outcomes'])
      assert.deepEqual(project[section], [], `${section} must not manufacture a case study`);
  }
});

test('fallback artifacts are never relabeled as live GitHub results', async () => {
  const { buildUniverseContent } = await load;
  const projects = buildUniverseContent({
    ...emptyFeed,
    source: 'fallback',
    selection: undefined,
    items: [repository()],
  }).projects;
  assert.ok(!projects.some(project => project.source === 'github'));
  const fallback = projects.filter(project => project.source === 'fallback');
  assert.equal(fallback.length, 2);
  assert.ok(fallback.every(project => /not a live GitHub result/.test(project.provenance)));
  assert.equal(projects.filter(project => project.slug === 'face-mask-detection').length, 1);
});

test('external links reject executable protocols, credentials, malformed URLs and control characters', async () => {
  const { safeExternalUrl, buildUniverseContent } = await load;
  for (const url of [
    'javascript:alert(1)',
    'data:text/html,test',
    'vbscript:msgbox(1)',
    'file:///C:/secret',
    '//example.com',
    '/local',
    'https://user:pass@example.com',
    'https://example.com/\nunsafe',
    'https://example.com/a b',
    'not a url',
  ]) {
    assert.equal(safeExternalUrl(url), undefined, url);
  }
  assert.equal(
    safeExternalUrl('https://github.com/chiranjeev-21'),
    'https://github.com/chiranjeev-21'
  );
  const projects = buildUniverseContent({
    ...emptyFeed,
    items: [
      repository({ id: 'unsafe-source', url: 'javascript:alert(1)' }),
      repository({ id: 'safe-source', homepageUrl: 'data:text/html,fake' }),
    ],
  }).projects;
  assert.ok(!projects.some(project => project.id === 'github-unsafe-source'));
  assert.equal(projects.find(project => project.id === 'github-safe-source').demoUrl, undefined);
  for (const project of projects) {
    if (project.sourceUrl) assert.match(project.sourceUrl, /^https?:\/\//);
    if (project.demoUrl) assert.match(project.demoUrl, /^https?:\/\//);
  }
});

test('verified profile, career qualifications, and original source destinations are preserved', async () => {
  const { PROFILE, CAREER, SKILLS, buildUniverseContent } = await load;
  assert.equal(PROFILE.name, 'Chiranjeev Singh');
  assert.equal(PROFILE.email, 'chiranj33v.singh@gmail.com');
  assert.equal(
    PROFILE.socials.find(link => link.label === 'LinkedIn').href,
    'https://www.linkedin.com/in/chiranjeev-singh-2a012b219/'
  );
  assert.equal(CAREER[0].company, 'Microsoft');
  assert.equal(CAREER[0].role, 'Software Engineer · L60');
  assert.equal(CAREER[0].period, '04/2026 — Present');
  assert.match(CAREER[0].highlights.join(' '), /~80% in failure testing/);
  assert.equal(CAREER[1].period, '05/2025 — 02/2026');
  assert.equal(CAREER[2].period, '07/2024 — 04/2025');
  assert.equal(CAREER[3].period, '01/2024 — 07/2024');
  assert.ok(SKILLS.some(skill => skill.label === 'Agentic AI'));
  assert.ok(SKILLS.some(skill => skill.label === 'Distributed Computing'));
  const projects = buildUniverseContent(emptyFeed).projects;
  assert.equal(
    projects.find(project => project.slug === 'cj-os-desktop').sourceUrl,
    'https://github.com/chiranjeev-21/ME/tree/feature/cj-os-desktop'
  );
  assert.equal(
    projects.find(project => project.slug === 'cj-os-desktop').demoUrl,
    'https://portfolio-klmg84qar-capstonelader-9077s-projects.vercel.app'
  );
  assert.equal(
    projects.find(project => project.slug === 'cj-universe').sourceUrl,
    'https://github.com/chiranjeev-21/ME/tree/feature/cj-universe-3d'
  );
  assert.equal(
    projects.find(project => project.slug === 'face-mask-detection').sourceUrl,
    'https://drive.google.com/drive/u/1/folders/1Kzb7cPkzDbj38a8uRQgOvbUnCQTpJK8Z'
  );
});

test('three substantive, typed studio notes contain safe text sections, not fabricated publication metadata', async () => {
  const { buildUniverseContent } = await load;
  const { articles } = buildUniverseContent(emptyFeed);
  assert.equal(articles.length, 3);
  assert.equal(new Set(articles.map(article => article.slug)).size, articles.length);
  for (const article of articles) {
    assert.equal(article.kind, 'Studio note');
    assert.ok(article.sections.length >= 3);
    assert.equal(article.date, undefined);
    assert.equal(article.publishedAt, undefined);
    assert.match(article.slug, /^[a-z0-9-]+$/);
    for (const section of article.sections) {
      assert.ok(section.heading);
      assert.ok(section.paragraphs.length >= 2);
      assert.ok(section.paragraphs.join(' ').length > 500);
      assert.ok(section.paragraphs.every(paragraph => !/<(script|iframe|img)\b/i.test(paragraph)));
      if (section.code) assert.equal(typeof section.code, 'string');
    }
  }
  const fresh = buildUniverseContent(emptyFeed);
  articles[0].sections[0].paragraphs[0] = 'mutated by caller';
  assert.notEqual(fresh.articles[0].sections[0].paragraphs[0], 'mutated by caller');
});

test('portrait, original résumé, and actual CJ OS screenshot resolve to real supplied assets', async () => {
  const { PROFILE, buildUniverseContent } = await load;
  const project = buildUniverseContent(emptyFeed).projects.find(
    project => project.slug === 'cj-os-desktop'
  );
  assert.equal(PROFILE.resume, '/resume/Chiranjeev-Singh-Resume.pdf');
  assert.equal(project.image, '/images/projects/cj-os-desktop.webp');
  const universe = buildUniverseContent(emptyFeed).projects.find(
    item => item.slug === 'cj-universe'
  );
  for (const asset of [PROFILE.portrait, PROFILE.resume, project.image, universe.image]) {
    assert.ok(
      fs.statSync(path.join(root, 'public', ...asset.split('/').filter(Boolean))).size > 0,
      asset
    );
  }
  assert.match(project.imageAlt, /Actual CJ OS desktop runtime/);
  assert.match(universe.imageAlt, /Actual CJ Universe runtime/);
});

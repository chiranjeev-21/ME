const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { pathToFileURL } = require('node:url');

const loadPortfolio = import(
  pathToFileURL(path.resolve(__dirname, '..', 'src', 'os', 'filesystem.ts')).href
);

function makeFeed(source = 'github', selection = 'pinned') {
  return {
    source,
    ...(source === 'github' && selection ? { selection } : {}),
    profile: { login: 'chiranjeev-21', url: 'https://github.com/chiranjeev-21' },
    items: [
      {
        id: 'fixture-repository',
        name: 'Metadata-only example',
        description: 'A repository description supplied by the feed.',
        url: 'https://github.com/chiranjeev-21/metadata-example',
        homepageUrl: 'https://example.com/demo',
        primaryLanguage: { name: 'TypeScript' },
        stargazerCount: 7,
        forkCount: 2,
        updatedAt: '2026-10-01T12:00:00Z',
        topics: ['retrieval', 'experiment'],
      },
    ],
  };
}

test('virtual paths are canonical, unique, and connected to actual parent folders', async () => {
  const { buildPortfolioFiles } = await loadPortfolio;
  const files = buildPortfolioFiles(makeFeed());
  const entries = new Map(files.map(entry => [entry.path, entry]));
  assert.equal(entries.size, files.length);
  for (const entry of files) {
    assert.ok(entry.path.startsWith('/'), entry.path);
    assert.equal(path.posix.normalize(entry.path), entry.path);
    assert.equal(entry.path.includes('\\'), false);
    assert.equal(entry.path.endsWith('/') && entry.path !== '/', false);
    assert.equal(entry.name, entry.path === '/' ? '/' : path.posix.basename(entry.path));
    if (entry.path !== '/') {
      assert.equal(entries.get(path.posix.dirname(entry.path))?.kind, 'directory', entry.path);
    }
    if (entry.kind === 'directory') assert.equal(entry.appId, 'explorer', entry.path);
  }
  for (const folder of [
    '/',
    '/home',
    '/home/cj',
    '/home/cj/projects',
    '/home/cj/experiments',
    '/home/cj/writing',
    '/home/cj/assets',
    '/home/cj/.secrets',
  ]) {
    assert.equal(entries.get(folder)?.kind, 'directory', folder);
  }
});

test('required documents have genuine content and preserve contact, résumé, and hidden routes', async () => {
  const { buildPortfolioFiles } = await loadPortfolio;
  const files = buildPortfolioFiles(makeFeed());
  const entries = new Map(files.map(entry => [entry.path, entry]));
  for (const relativePath of [
    'about.md',
    'contact.md',
    'resume.md',
    'projects/cj-os/README.md',
    'projects/ai-lab/README.md',
    'experiments/ai-lab/README.md',
    'writing/design notes.md',
    '.secrets/treasure.map',
  ]) {
    const entry = entries.get(`/home/cj/${relativePath}`);
    assert.equal(entry?.kind, 'file', relativePath);
    assert.ok(entry.content.length > 200, relativePath);
    assert.doesNotMatch(entry.content, /\blorem ipsum\b|\bTODO\b|coming soon/i);
  }
  const resume = entries.get('/home/cj/resume.md');
  assert.equal(resume.appId, 'resume');
  assert.match(resume.content, /Microsoft — Software Engineer · L60/);
  assert.match(resume.content, /04\/2026 — Present/);
  assert.match(resume.content, /Azure Direct Drive/);
  assert.match(resume.content, /~80% in failure testing/);
  assert.match(resume.content, /Amazon[\s\S]+05\/2025 — 02\/2026/);
  assert.match(resume.content, /Oyo — SDE 1[\s\S]+07\/2024 — 04\/2025/);
  assert.match(resume.content, /Oyo — SDE Intern[\s\S]+01\/2024 — 07\/2024/);
  assert.match(resume.content, /Agentic AI/);
  assert.match(resume.content, /Distributed Computing/);
  assert.match(resume.content, /9\.30 CGPA/);
  assert.doesNotMatch(resume.content, /<\/?strong>/);
  assert.match(entries.get('/home/cj/contact.md').content, /mailto|Email:/);
  assert.match(entries.get('/home/cj/contact.md').content, /linkedin\.com/);
  assert.match(entries.get('/home/cj/contact.md').content, /github\.com/);
  assert.equal(entries.get('/home/cj/.secrets').hidden, true);
  const map = entries.get('/home/cj/.secrets/treasure.map');
  assert.equal(map.hidden, true);
  assert.equal(map.appId, 'vault');
  assert.match(
    entries.get('/home/cj/writing/design notes.md').content,
    /"\/home\/cj\/writing\/design notes\.md"/
  );
});

test('each project has one canonical folder and README resolving to the same case study', async () => {
  const { buildPortfolioFiles, buildProjectCaseStudies } = await loadPortfolio;
  const feed = makeFeed();
  const projects = buildProjectCaseStudies(feed);
  const files = buildPortfolioFiles(feed);
  const entries = new Map(files.map(entry => [entry.path, entry]));
  assert.equal(new Set(projects.map(project => project.id)).size, projects.length);
  assert.equal(new Set(projects.map(project => project.slug)).size, projects.length);
  for (const project of projects) {
    const folder = entries.get(`/home/cj/projects/${project.slug}`);
    const readme = entries.get(`${folder?.path}/README.md`);
    assert.equal(folder?.kind, 'directory', project.slug);
    assert.equal(folder.projectId, project.id);
    assert.equal(folder.appId, 'explorer');
    assert.equal(readme?.projectId, project.id);
    assert.equal(readme.appId, 'project');
    assert.ok(readme.content.includes(project.title));
    assert.ok(readme.content.includes(project.problem));
    for (const field of ['approach', 'architecture', 'outcomes']) {
      assert.ok(project[field].length, `${project.slug}: ${field}`);
    }
  }
  for (const entry of files.filter(entry => entry.projectId)) {
    assert.ok(
      projects.some(project => project.id === entry.projectId),
      entry.path
    );
  }
  const experiment = entries.get('/home/cj/experiments/ai-lab/README.md');
  assert.equal(experiment.projectId, 'ai-lab');
  assert.equal(experiment.content, entries.get('/home/cj/projects/ai-lab/README.md').content);
});

test('project names cannot escape the tree, and repeated names and IDs do not duplicate paths', async () => {
  const { buildPortfolioFiles, buildProjectCaseStudies } = await loadPortfolio;
  const feed = makeFeed();
  const item = feed.items[0];
  feed.items = [
    { ...item, id: 'one', name: '../../cj-os' },
    { ...item, id: 'two', name: '../../cj-os' },
    { ...item, id: 'two', name: 'Duplicate identity' },
    { ...item, id: 'three', name: '👩‍💻 / . ..' },
  ];
  const projects = buildProjectCaseStudies(feed);
  const files = buildPortfolioFiles(feed);
  assert.equal(projects.length, 5);
  assert.equal(new Set(files.map(entry => entry.path)).size, files.length);
  for (const project of projects) {
    assert.match(project.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(files.some(entry => entry.path === `/home/cj/projects/${project.slug}/README.md`));
  }
  const reordered = buildProjectCaseStudies({ ...feed, items: [...feed.items].reverse() });
  assert.equal(
    reordered.find(project => project.id === 'github:one').slug,
    projects.find(project => project.id === 'github:one').slug
  );
});

test('pinned, recent, unspecified, and fallback provenance remain distinct without invented details', async () => {
  const { buildProjectCaseStudies, buildPortfolioFiles, portfolioFeedLabel } = await loadPortfolio;
  const expected = [
    ['github', 'pinned', /pinned selection/i],
    ['github', 'recent', /recent repositories/i],
    ['github', undefined, /selection not specified/i],
    ['fallback', undefined, /local fallback/i],
  ];
  for (const [source, selection, label] of expected) {
    const feed = makeFeed(source, selection);
    if (!selection) delete feed.selection;
    const project = buildProjectCaseStudies(feed).find(item =>
      item.id.endsWith(':fixture-repository')
    );
    assert.equal(project.source, source === 'github' ? 'github' : 'local');
    assert.match(project.summary, label);
    assert.match(portfolioFeedLabel(feed), label);
    assert.match(project.architecture.join(' '), /Architecture notes are not published/);
    assert.deepEqual(project.stack, ['TypeScript', 'Topic: retrieval', 'Topic: experiment']);
    assert.equal(project.repoUrl, feed.items[0].url);
    assert.equal(project.demoUrl, feed.items[0].homepageUrl);
    assert.match(project.limitations.join(' '), /not a verified architecture/);
    assert.match(project.outcomes.join(' '), /No usage|not live activity/);
    const readme = buildPortfolioFiles(feed).find(
      entry => entry.path === `/home/cj/projects/${project.slug}/README.md`
    );
    assert.match(readme.content, label);
    if (source === 'fallback') {
      assert.match(project.problem, /not evidence that a live GitHub request succeeded/);
      assert.doesNotMatch(project.summary, /pinned selection|recent repositories/);
    }
  }
});

test('local investigations describe actual boundaries and external links reject executable schemes', async () => {
  const { buildProjectCaseStudies, portfolioWebUrl } = await loadPortfolio;
  const feed = makeFeed();
  feed.items[0].url = 'javascript:alert(1)';
  feed.items[0].homepageUrl = 'data:text/html,<script>alert(1)</script>';
  feed.items[0].primaryLanguage = null;
  feed.items[0].topics = [];
  feed.items[0].description = '';
  const projects = buildProjectCaseStudies(feed);
  const cj = projects.find(project => project.id === 'cj-os');
  const lab = projects.find(project => project.id === 'ai-lab');
  const metadataOnly = projects.find(project => project.id.startsWith('github:'));
  assert.match(cj.architecture.join(' '), /typed app definitions/);
  assert.match(cj.architecture.join(' '), /pointer-driven window manager/i);
  assert.match(cj.architecture.join(' '), /read-only filesystem/);
  assert.match(lab.architecture.join(' '), /TF-IDF/);
  assert.match(lab.architecture.join(' '), /no remote LLM, semantic embedding model/);
  assert.match(lab.limitations.join(' '), /not semantic understanding/);
  assert.equal(metadataOnly.repoUrl, undefined);
  assert.equal(metadataOnly.demoUrl, undefined);
  assert.deepEqual(metadataOnly.stack, []);
  assert.match(metadataOnly.summary, /No project description was supplied/);
  for (const value of [
    'javascript:alert(1)',
    'data:text/html,hi',
    'file:///etc/passwd',
    '//x.test',
  ]) {
    assert.equal(portfolioWebUrl(value), undefined);
  }
});

test('image and PDF entries point to real public assets, and the original PDF is downloadable', async () => {
  const { buildPortfolioFiles } = await loadPortfolio;
  const files = buildPortfolioFiles(makeFeed());
  const portrait = files.find(entry => entry.path === '/home/cj/assets/portrait.jpeg');
  const resume = files.find(entry => entry.path === '/home/cj/assets/resume.pdf');
  assert.equal(portrait.assetUrl, '/images/photo.jpeg');
  assert.equal(resume.assetUrl, '/resume/Chiranjeev-Singh-Resume.pdf');
  assert.equal(resume.mime, 'application/pdf');
  assert.equal(resume.appId, 'reader');
  for (const entry of [portrait, resume]) {
    const file = path.resolve(__dirname, '..', 'public', ...entry.assetUrl.slice(1).split('/'));
    assert.ok(fs.statSync(file).isFile());
  }
  const pdf = fs.readFileSync(
    path.resolve(__dirname, '..', 'public', 'resume', 'Chiranjeev-Singh-Resume.pdf')
  );
  assert.equal(pdf.subarray(0, 5).toString('ascii'), '%PDF-');
  assert.ok(pdf.length > 1000, 'PDF must not be a placeholder');
});

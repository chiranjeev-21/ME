import {
  EDUCATION,
  EMAIL,
  EXPERIENCE,
  HERO_SKILLS,
  PROJECTS,
  SOCIAL_LINKS,
} from '../constants/index.ts';
import type {
  ContentFeed,
  ProjectCategory,
  UniverseArticle,
  UniverseContent,
  UniverseProject,
} from './types';

export const PROFILE = {
  name: 'Chiranjeev Singh',
  shortName: 'CJ',
  email: EMAIL,
  socials: SOCIAL_LINKS,
  portrait: '/images/portrait.webp',
  resume: '/resume/Chiranjeev-Singh-Resume.pdf',
};
export const CAREER = EXPERIENCE;
export const SKILLS = HERO_SKILLS;
export const QUALIFICATIONS = EDUCATION;

export function plainText(value: string) {
  return value.replace(/<\/?strong>/g, '');
}

/** Only ordinary web destinations may leave the portfolio. Credentials are never accepted. */
export function safeExternalUrl(value: unknown): string | undefined {
  if (
    typeof value !== 'string' ||
    [...value].some(character => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127)
  )
    return undefined;
  try {
    const url = new URL(value);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    )
      return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

const ARTICLES: UniverseArticle[] = [
  {
    slug: 'one-universe-two-ways-in',
    kind: 'Studio note',
    title: 'One universe. Two ways in.',
    summary:
      'Why a cinematic entrance must never become the only entrance, and how Explore and Browse share a destination.',
    tags: ['Interface design', 'Accessibility', '3D'],
    sections: [
      {
        heading: 'The scene is an invitation, not a requirement',
        paragraphs: [
          'A solar system can express the relationships between a person’s interests. It is not automatically a good document reader. Camera movement, small targets, and a busy background can add effort precisely when someone wants a résumé or a project link. The design separates the invitation from the work: the scene introduces destinations, while a readable panel contains the actual content.',
          'Browse is an equal entrance, not a reduced portfolio. About, project case studies, writing, contact details, and the working lab use the same components in both modes. A visitor should not have to solve a spatial interface to find a conventional career history or download the original PDF.',
        ],
      },
      {
        heading: 'A URL is a durable piece of interface',
        paragraphs: [
          'A project is an addressable document, not a transient camera position. Its route can be copied, opened in another tab, or reached without loading the scene. Real anchors preserve the browser’s native tools. Only an unmodified primary click is intercepted for client-side navigation; modifier keys remain the browser’s responsibility.',
          'The mode belongs in the URL, but it does not define the identity of the content. Switching from Explore to Browse should change the layout rather than replace the project browser. Keeping the content host mounted also preserves local search filters and creative controls while the surrounding presentation changes.',
        ],
        code: '/projects/cj-os-desktop?mode=browse\n/writing/one-universe-two-ways-in?mode=browse',
      },
      {
        heading: 'Graceful degradation is part of the composition',
        paragraphs: [
          'Reduced motion, keyboard navigation, and unavailable WebGL are not unusual exceptions. They are real conditions under which the portfolio must remain useful. The text-first path should have the same material and direct links, with no promise that an animated scene is necessary to understand the work.',
          'The trade-off is deliberate: cinematic exploration cannot own every interaction. Reading, filtering, copying an email address, and opening source code should feel familiar. The most successful moment may be the one where the interface gets out of the way.',
        ],
      },
    ],
  },
  {
    slug: 'retrieval-is-not-evidence',
    kind: 'Studio note',
    title: 'Retrieval is not evidence.',
    summary:
      'A useful local lab should show what it found, what it did not find, and where its authority ends.',
    tags: ['Retrieval', 'AI', 'Evidence'],
    sections: [
      {
        heading: 'Start with the actual mechanism',
        paragraphs: [
          'The CJ OS retrieval lab uses local lexical retrieval. It searches a bounded body of portfolio material rather than calling a remote language model. That distinction changes the promise: matching words can help a visitor locate a relevant passage, but it does not produce a new verified fact or demonstrate semantic understanding.',
          'An interface can make this mechanism useful without dressing it up as an autonomous agent. Showing the retrieved passage and its source makes a result inspectable. A clear empty state is more informative than a fluent answer stitched together from unrelated material.',
        ],
      },
      {
        heading: 'Keep claims smaller than their sources',
        paragraphs: [
          'A repository description is evidence of how the repository is described, not evidence of its architecture, reliability, or deployment status. The project catalog therefore distinguishes authored case studies from public GitHub metadata. Missing implementation detail stays missing until a source supports it.',
          'The same discipline applies to résumé metrics. A result observed in failure testing must retain that condition wherever it appears. Removing the words “in failure testing” would change the meaning of the result, even if the number were copied correctly. Presentation is part of evidence handling.',
        ],
      },
      {
        heading: 'An honest boundary improves the experiment',
        paragraphs: [
          'A small inspectable corpus makes it possible to reason about failures: no relevant text, an ambiguous term, or a lexical match that does not answer the question. These are different outcomes and should not be hidden behind a single confident response. The lab is most useful when a visitor can see the gap.',
          'If a future version uses embeddings or generation, that would introduce new dependencies and new failure modes. It would still need source attribution, explicit uncertainty, and a clear separation between quoted material and synthesis. A more sophisticated model would not remove the need for those boundaries.',
        ],
      },
    ],
  },
  {
    slug: 'reliable-interfaces-have-one-map',
    kind: 'Studio note',
    title: 'Reliable interfaces have one map.',
    summary:
      'Shared navigation, constrained state, and honest failure paths across a desktop and a solar system.',
    tags: ['Architecture', 'Reliability', 'Navigation'],
    sections: [
      {
        heading: 'Multiple entrances, one destination',
        paragraphs: [
          'A planet, a menu item, a terminal command, and a project card can all lead to the same document. If each entrance owns its own version of navigation, small inconsistencies accumulate: a stale project selection, an article left open in the wrong world, or a back button that restores only half the screen.',
          'The more robust arrangement is a shared navigation model. A destination identifies a world and, where appropriate, a project or article. Presentation mode remains a separate dimension. Components request navigation changes rather than rebuilding the router or hiding independent copies of application state.',
        ],
      },
      {
        heading: 'Make invalid states uninteresting',
        paragraphs: [
          'A direct link may point to a project that no longer appears in the feed. A filter may remove every matching item. A copy operation may fail because the browser denies clipboard access. These outcomes should produce a useful next action rather than an empty panel or a claim that the operation succeeded.',
          'For a missing document, the simplest recovery is a real return link to its collection. For a search with no results, keep the query visible and offer a reset. For a failed copy, leave the email address selectable. Reliability at this scale is often a collection of small, visible decisions.',
        ],
      },
      {
        heading: 'Share behavior before sharing decoration',
        paragraphs: [
          'The destinations in this universe have different visual identities: a paper reading room should not look like an industrial blueprint. They still share the behavior of links, source attribution, focus, and recovery. Consistency does not require making every screen the same card grid.',
          'CJ OS explores a related idea through a shared app registry and window manager. This universe uses a different spatial metaphor, but the constraint is similar: the shell coordinates the experience; the content remains understandable on its own. A reliable interface is one whose central map stays legible when its presentation changes.',
        ],
      },
    ],
  },
];

function curatedProjects(fallback: boolean): UniverseProject[] {
  const research = PROJECTS.find(project => project.id === 'face-mask-detection')!;
  return [
    {
      id: 'curated-cj-os',
      slug: 'cj-os-desktop',
      title: 'CJ OS',
      summary:
        'A personal portfolio as a working desktop: shared apps, managed windows, a read-only terminal, and inspectable local retrieval.',
      categories: ['Web', 'Systems'],
      problem:
        'Give a desktop-inspired portfolio useful behavior without making basic information depend on discovering a simulated operating system.',
      constraints: [
        'Browser-based React/TypeScript application; not a real operating system.',
        'Keep résumé and source links accessible on desktop and mobile.',
        'The virtual filesystem is read-only; the retrieval lab is local and lexical, not a remote LLM.',
      ],
      architecture: [
        'A shared app registry connects desktop entry points to the same applications.',
        'A window manager coordinates open applications and desktop interaction.',
        'A read-only virtual parser and filesystem expose portfolio material through terminal commands.',
        'A real GitHub feed supplements curated work; the original PDF remains a direct document.',
      ],
      decisions: [
        'Use familiar desktop affordances while preserving direct access to conventional portfolio material.',
        'Make retrieval evidence inspectable instead of presenting local search as generated intelligence.',
        'Use a real runtime screenshot to document the implemented desktop.',
      ],
      tradeoffs: [
        'A desktop metaphor adds interaction complexity and requires a considered mobile layout.',
        'Lexical retrieval is bounded by the local corpus and can miss relevant material with different wording.',
        'The preview may require sign-in because of deployment protection.',
      ],
      technologies: ['React', 'TypeScript', 'Vite', 'Local lexical retrieval', 'GitHub feed'],
      outcomes: [
        'Implemented desktop and mobile portfolio interactions with shared applications.',
        'Desktop and mobile flows were tested; no performance benchmark is claimed here.',
        'The image below is an actual CJ OS desktop screenshot, not a design mockup.',
      ],
      sourceUrl: 'https://github.com/chiranjeev-21/ME/tree/feature/cj-os-desktop',
      demoUrl: 'https://portfolio-klmg84qar-capstonelader-9077s-projects.vercel.app',
      image: '/images/projects/cj-os-desktop.webp',
      imageAlt: 'Actual CJ OS desktop runtime showing the implemented portfolio interface.',
      provenance:
        'Authored implementation case study · actual runtime image · preview may require sign-in.',
      source: 'curated',
    },
    {
      id: 'curated-cj-universe',
      slug: 'cj-universe',
      title: 'CJ Universe',
      summary:
        'The portfolio you are reading: seven distinct destinations, a cinematic solar system, and an equally capable text-first path.',
      categories: ['Web', 'Experiments'],
      problem:
        'Make spatial exploration memorable without making it a prerequisite for reading, navigation, or contacting the person behind the work.',
      constraints: [
        'Explore and Browse must share content and navigation.',
        'WebGL availability and reduced-motion preferences must not block access to the portfolio.',
        'Public repository metadata cannot support invented implementation claims.',
      ],
      architecture: [
        'A shared navigation model identifies worlds, projects, articles, and presentation mode.',
        'A Three.js scene provides spatial discovery; React destination views carry the readable content.',
        'A typed content adapter separates authored case studies from public GitHub metadata.',
        'The AI Lab is one shared working surface supplied by the application, not a duplicate demonstration.',
      ],
      decisions: [
        'Give each destination a distinct visual grammar rather than recoloring one card template.',
        'Use real anchor destinations with client navigation only for ordinary primary clicks.',
        'Provide an original procedural sketch in the creative studio instead of fabricated project media.',
      ],
      tradeoffs: [
        'Spatial rendering introduces capability and motion considerations absent from a plain document.',
        'A GitHub feed may be unavailable, so fallback provenance stays visible.',
        'This case study describes the implementation, not a measured performance or business outcome.',
      ],
      technologies: ['React', 'TypeScript', 'Vite', 'Three.js', 'React Three Fiber'],
      outcomes: [
        'One content model supports both an exploratory presentation and direct Browse routes.',
        'The catalog includes authored implementation notes and explicitly labeled repository metadata.',
        'This is the current portfolio implementation; no external launch metrics are claimed.',
      ],
      sourceUrl: 'https://github.com/chiranjeev-21/ME/tree/feature/cj-universe-3d',
      image: '/images/projects/cj-universe.webp',
      imageAlt:
        'Actual CJ Universe runtime with the rendered central sun and seven selectable worlds.',
      provenance:
        'Authored case study of this implementation · branch source, not a separate live deployment.',
      source: 'curated',
    },
    {
      id: research.id,
      slug: 'face-mask-detection',
      title: research.title,
      summary: research.description,
      categories: ['AI/ML'],
      problem:
        'Detect face-mask offenders in real time through camera surveillance, as described in the original portfolio research artifact.',
      constraints: [
        'Only the original artifact description and linked folder are supplied here.',
        'Training data, evaluation protocol, implementation detail, and deployment results are not supplied.',
      ],
      architecture: [
        'The supplied description identifies a YOLO-based detection system. Further architecture is not documented in this portfolio.',
      ],
      decisions: [
        'Link to the supplied research artifact rather than reconstructing an unsupported technical case study.',
      ],
      tradeoffs: [
        'No accuracy, latency, dataset, or production-readiness claim can be made from the supplied description alone.',
      ],
      technologies: ['YOLO', 'Computer Vision'],
      outcomes: [
        'Published with Intellectual Property India, 2022, as stated in the original portfolio description.',
      ],
      sourceUrl: safeExternalUrl(research.href),
      provenance: fallback
        ? 'Local fallback research artifact from the original portfolio · not a live GitHub result.'
        : 'Research artifact from the original portfolio constants · not a GitHub case study.',
      source: fallback ? 'fallback' : 'curated',
    },
  ];
}

function projectCategories(topics: string[], language: string): ProjectCategory[] {
  const text = `${topics.join(' ')} ${language}`.toLowerCase();
  const categories: ProjectCategory[] = [];
  if (/\b(ai|ml|llm|rag|pytorch|tensorflow|machine-learning|computer-vision)\b/.test(text))
    categories.push('AI/ML');
  if (/\b(react|nextjs|web|website|frontend|javascript|typescript|html|css|vue)\b/.test(text))
    categories.push('Web');
  if (/\b(systems|distributed|storage|kernel|rust|operating-system)\b/.test(text))
    categories.push('Systems');
  if (/\b(game|games|gamedev|unity|godot|unreal)\b/.test(text)) categories.push('Games');
  return categories.length ? categories : ['Experiments'];
}

function safeSlug(value: string): string {
  return (
    value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 76)
      .replace(/-$/g, '') || 'project'
  );
}

export function buildUniverseContent(feed: ContentFeed): UniverseContent {
  const projects = curatedProjects(feed.source === 'fallback');
  const slugs = new Set(projects.map(project => project.slug));
  const ids = new Set<string>();
  const urls = new Set(
    projects.map(project => project.sourceUrl?.replace(/\/$/, '').toLowerCase())
  );
  const curatedNames = new Set(projects.map(project => safeSlug(project.title)));
  const names = new Set<string>();
  for (const item of feed.items) {
    const sourceUrl = safeExternalUrl(item.url);
    const canonical = sourceUrl?.replace(/\/$/, '').toLowerCase();
    const normalizedName = safeSlug(item.name);
    const displayName = item.name.normalize('NFKC').toLowerCase().trim();
    if (
      !sourceUrl ||
      !canonical ||
      ids.has(item.id) ||
      urls.has(canonical) ||
      curatedNames.has(normalizedName) ||
      names.has(displayName)
    )
      continue;
    // Both curated portfolio implementations already document this repository.
    if (/^https?:\/\/github\.com\/chiranjeev-21\/me(?:\/|$)/i.test(sourceUrl)) continue;
    ids.add(item.id);
    urls.add(canonical);
    names.add(displayName);
    const base = `repo-${normalizedName}`;
    let slug = base;
    let suffix = 2;
    while (slugs.has(slug)) slug = `${base}-${suffix++}`;
    slugs.add(slug);
    const language = item.primaryLanguage?.name || '';
    const selection =
      feed.selection === 'pinned'
        ? 'Pinned public repository'
        : feed.selection === 'recent'
          ? 'Recent public repository'
          : 'Public GitHub metadata';
    const provenance =
      feed.source === 'github'
        ? `${selection} · repository metadata, not an authored case study.`
        : 'Local fallback metadata · not a live GitHub result.';
    projects.push({
      id: `${feed.source}-${item.id}`,
      slug,
      title: item.name,
      summary:
        item.description ||
        'No repository description supplied. Open the source for the available project information.',
      categories: projectCategories(item.topics, language),
      problem:
        item.description || 'The repository does not supply a public description in this feed.',
      constraints: [
        'Only public feed metadata is available here; implementation and case-study detail have not been supplied.',
      ],
      architecture: [
        'Architecture is not documented in this portfolio. Inspect the linked repository for source and documentation.',
      ],
      decisions: [
        'Show the repository description, language, and topics without inferring engineering decisions or outcomes.',
      ],
      tradeoffs: [
        'Repository metadata does not verify functionality, production readiness, deployment status, or performance.',
      ],
      technologies: [...new Set([language, ...item.topics].filter(Boolean))],
      outcomes: ['No independently documented project outcomes are supplied by this feed.'],
      sourceUrl,
      demoUrl: safeExternalUrl(item.homepageUrl),
      provenance,
      source: feed.source,
    });
  }
  return {
    projects,
    articles: ARTICLES.map(article => ({
      ...article,
      tags: [...article.tags],
      sections: article.sections.map(section => ({
        ...section,
        paragraphs: [...section.paragraphs],
      })),
    })),
  };
}

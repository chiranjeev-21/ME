import { EDUCATION, EMAIL, EXPERIENCE, HERO_SKILLS, SOCIAL_LINKS } from '../constants/index.ts';
import type { PortfolioFeed, ProjectCaseStudy, VfsEntry } from './types';

const HOME = '/home/cj';

export function portfolioText(value: string): string {
  return value.replace(/<\/?strong>/g, '');
}

export function portfolioFeedLabel(feed: PortfolioFeed): string {
  if (feed.source === 'fallback') return 'Local fallback · not live GitHub data';
  if (feed.selection === 'pinned') return 'GitHub · pinned selection';
  if (feed.selection === 'recent') return 'GitHub · recent repositories';
  return 'GitHub · selection not specified';
}

export function portfolioWebUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function stableSuffix(value: string): string {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

const LOCAL_PROJECTS: readonly ProjectCaseStudy[] = [
  {
    id: 'cj-os',
    slug: 'cj-os',
    title: 'CJ OS',
    summary: 'A portfolio you can investigate: one desktop, a shared app registry, and real tools.',
    problem:
      'A long scrolling page makes the visitor follow one narrative. CJ OS lets a recruiter open a conventional résumé while a curious engineer explores projects, a shell, or an inspectable AI experiment without leaving the same workspace.',
    approach: [
      'Make every destination an application, not an anchor to a hidden scrolling page. Resume, Project Explorer, Terminal, AI Lab, and the Vault all open through the same registry and window manager.',
      'Give files canonical paths in a local read-only virtual filesystem. Explorer and the shell resolve the same documents and project investigations instead of maintaining separate content or modal systems.',
      'Keep the conventional route obvious: résumé, contact links, and the original PDF are available with a click; terminal knowledge and treasure hunting are optional.',
      'Use actual GitHub repository metadata and label pinned, recent, and local fallback selections distinctly. Never turn an unavailable connection into fictional live activity.',
    ],
    architecture: [
      'React + TypeScript components share typed app definitions, window state, payloads, and openApp/openPath commands. A project ID or canonical file path is the handoff between applications.',
      'The pointer-driven window manager owns desktop window position, size, focus, minimization, and maximization. Applications own their internal scrolling and responsive layouts.',
      'Pure data builders assemble case studies and a /home/cj read-only filesystem. The local shell works against that virtual tree, not the visitor’s or server’s host filesystem.',
      'A same-origin GitHub integration supplies public project metadata. The shared feed retains source and selection provenance; locally curated artifacts remain explicitly marked as fallback.',
      'The AI Lab runs local lexical retrieval and extractive evidence inside the browser. It does not call a remote LLM or run a semantic embedding model.',
    ],
    stack: [
      'React',
      'TypeScript',
      'CSS Modules',
      'Pointer Events',
      'GitHub API',
      'Virtual filesystem',
    ],
    outcomes: [
      'Résumé, project investigations, documents, and experiments share a single desktop navigation model.',
      'Canonical paths make a file opened in Explorer the same resource opened from the shell.',
      'The hidden builder layer is a side track, not a gate to the professional portfolio.',
    ],
    limitations: [
      'This is a browser portfolio, not an operating system emulator. Its filesystem is intentionally read-only and local.',
      'GitHub metadata availability depends on the integration; fallback data is not a live repository measurement.',
      'No benchmark, adoption, or production-scale claims are made for this personal project.',
    ],
    source: 'local',
  },
  {
    id: 'ai-lab',
    slug: 'ai-lab',
    title: 'AI Lab',
    summary: 'A local TF-IDF retrieval + extractive-evidence sandbox, not an LLM chat facade.',
    problem:
      'AI demos often hide where an answer came from. This experiment makes lexical retrieval inspectable: submit a query, inspect matching documents and evidence, and see when the local corpus cannot support the query.',
    approach: [
      'Represent a small local document corpus with TF-IDF term weights and rank it against the query using lexical similarity.',
      'Expose the matching documents and extract supporting text from them instead of generating an unsupported answer.',
      'Make no-match and weak-match cases visible. A high lexical score is not a calibrated probability or proof of factual correctness.',
    ],
    architecture: [
      'The sandbox runs in the browser over local documents with TF-IDF retrieval and extractive evidence.',
      'There is no remote LLM, semantic embedding model, generative answer service, or secret API key.',
      'Lab interactions open through the shared desktop registry; recorded runs can be inspected through the desktop’s shared tools.',
    ],
    stack: ['TypeScript', 'React', 'TF-IDF', 'Lexical retrieval', 'Extractive evidence'],
    outcomes: [
      'An interactive, inspectable experiment for understanding what local retrieval can and cannot answer.',
      'Evidence stays attached to its source document rather than being presented as generated knowledge.',
    ],
    limitations: [
      'An evolving local sandbox, not a hosted model, general-purpose chatbot, or production RAG service.',
      'Lexical matching can miss synonyms and paraphrases; it is not semantic understanding.',
      'No accuracy, latency, or business-impact benchmark is claimed.',
    ],
    source: 'local',
  },
];

export function buildProjectCaseStudies(feed: PortfolioFeed): ProjectCaseStudy[] {
  const seen = new Set<string>();
  const usedSlugs = new Set(LOCAL_PROJECTS.map(project => project.slug));
  const projects = LOCAL_PROJECTS.map(project => ({
    ...project,
    approach: [...project.approach],
    architecture: [...project.architecture],
    stack: [...project.stack],
    outcomes: [...project.outcomes],
    limitations: [...(project.limitations ?? [])],
  }));
  for (const item of feed.items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const stem =
      item.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'project';
    const prefix = feed.source === 'github' ? 'github' : 'fallback';
    const baseSlug = `${prefix}-${stem}-${stableSuffix(item.id)}`;
    let slug = baseSlug;
    let collision = 2;
    while (usedSlugs.has(slug)) slug = `${baseSlug}-${collision++}`;
    usedSlugs.add(slug);
    const provenance = portfolioFeedLabel(feed);
    projects.push({
      id: `${prefix}:${item.id}`,
      slug,
      title: item.name,
      summary: `${item.description || 'No project description was supplied.'} (${provenance}.)`,
      problem:
        feed.source === 'github'
          ? 'The repository description above is the available project context. A separate problem statement is not published in this metadata.'
          : 'This is a locally curated fallback artifact. It is not evidence that a live GitHub request succeeded.',
      approach: [
        item.description || 'No implementation description was supplied.',
        'Implementation decisions and engineering trade-offs are not documented in the available metadata. Follow the project link to investigate.',
      ],
      architecture: [
        'Architecture notes are not published in the available metadata. No services, deployment topology, or model design are inferred.',
      ],
      stack: [
        ...(item.primaryLanguage ? [item.primaryLanguage.name] : []),
        ...item.topics.map(topic => `Topic: ${topic}`),
      ],
      outcomes: [
        feed.source === 'github'
          ? 'Public repository metadata is available through the GitHub integration. No usage, deployment, or business-impact claim is implied.'
          : 'The curated artifact remains accessible while live GitHub data is unavailable. Fallback dates and counters are not live activity.',
      ],
      limitations: [
        provenance,
        'Repository topics and primary language are metadata, not a verified architecture or complete dependency list.',
        'No independent performance, adoption, or production results are published in this feed.',
      ],
      repoUrl: portfolioWebUrl(item.url),
      demoUrl: portfolioWebUrl(item.homepageUrl),
      source: feed.source === 'github' ? 'github' : 'local',
    });
  }
  return projects;
}

function projectReadme(project: ProjectCaseStudy): string {
  const section = (heading: string, lines: readonly string[]) =>
    `## ${heading}\n${lines.map(line => `- ${line}`).join('\n')}`;
  return [
    `# ${project.title}`,
    project.summary,
    `## Problem\n${project.problem}`,
    section('Approach', project.approach),
    section('Architecture', project.architecture),
    section('Stack / published metadata', project.stack),
    section('Results', project.outcomes),
    section('Limits and provenance', project.limitations ?? []),
    project.repoUrl ? `Project source / artifact: ${project.repoUrl}` : '',
    project.demoUrl ? `Published homepage / demo link: ${project.demoUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function resumeText(): string {
  return [
    '# Chiranjeev Singh',
    'Software Engineer · Distributed Computing · Agentic AI',
    `Email: ${EMAIL}`,
    ...SOCIAL_LINKS.map(link => `${link.label}: ${link.href}`),
    'Original résumé PDF: /home/cj/assets/resume.pdf',
    '## Experience',
    ...EXPERIENCE.map(
      job =>
        `### ${job.company} — ${job.role}\n${job.period} · ${job.location}\n${job.highlights
          .map(highlight => `- ${portfolioText(highlight)}`)
          .join('\n')}`
    ),
    `## Skills\n${HERO_SKILLS.map(skill => skill.label).join(' · ')}`,
    `## Education & certifications\n${EDUCATION.map(item => `- ${item.title}: ${portfolioText(item.subtitle)}`).join('\n')}`,
  ].join('\n\n');
}

export function buildPortfolioFiles(feed: PortfolioFeed): VfsEntry[] {
  const directory = (
    path: string,
    description: string,
    extra: Partial<VfsEntry> = {}
  ): VfsEntry => ({
    path,
    name: path === '/' ? '/' : path.slice(path.lastIndexOf('/') + 1),
    kind: 'directory',
    appId: 'explorer',
    description,
    ...extra,
  });
  const document = (path: string, content: string, extra: Partial<VfsEntry> = {}): VfsEntry => ({
    path,
    name: path.slice(path.lastIndexOf('/') + 1),
    kind: 'file',
    mime: 'text/markdown',
    appId: 'reader',
    content,
    ...extra,
  });
  const projects = buildProjectCaseStudies(feed);
  return [
    directory('/', 'Read-only virtual filesystem root. No host files are exposed.'),
    directory('/home', 'Virtual home directories.'),
    directory(HOME, 'Chiranjeev Singh’s portfolio workspace.'),
    directory(`${HOME}/projects`, 'Local investigations and public project metadata.'),
    directory(`${HOME}/experiments`, 'Working, inspectable browser experiments.'),
    directory(`${HOME}/experiments/ai-lab`, 'Local TF-IDF retrieval and extractive evidence.'),
    directory(`${HOME}/writing`, 'Design decisions behind this desktop.'),
    directory(`${HOME}/assets`, 'Portrait and original downloadable résumé.'),
    directory(`${HOME}/.secrets`, 'An optional builder-layer side track.', { hidden: true }),
    document(
      `${HOME}/about.md`,
      `# Hello, I’m Chiranjeev Singh\n\nI’m a software engineer working on Azure Direct Drive at Microsoft, with experience across distributed computing, storage reliability, AI/ML, and retrieval systems.\n\nPreviously: Amazon JWO Tech and Oyo. I studied Computer Science at Thapar Institute of Engineering & Technology (2020–2024, 9.30 CGPA).\n\nThis portfolio is a small desktop, not a scrolling page. Project Explorer opens investigations, Resume provides the conventional overview and original PDF, and AI Lab is an inspectable local retrieval experiment. Everything uses the same application registry and virtual workspace.\n\nStart with /home/cj/resume.md or /home/cj/projects/cj-os/README.md. No terminal commands are required. The filesystem is read-only and never reads host files.`,
      { description: 'Introduction, engineering interests, and a guide to this workspace.' }
    ),
    document(
      `${HOME}/contact.md`,
      `# Contact\n\nChiranjeev Singh\n\nEmail: ${EMAIL}\n\n${SOCIAL_LINKS.map(link => `${link.label}: ${link.href}`).join('\n\n')}\n\nOpen Resume for one-click contact links and the original downloadable PDF. No availability or response-time promise is implied.`,
      { description: 'Email, LinkedIn, and GitHub.' }
    ),
    document(`${HOME}/resume.md`, resumeText(), {
      appId: 'resume',
      description: 'Verified experience, education, skills, and original PDF.',
    }),
    ...projects.flatMap(project => [
      directory(`${HOME}/projects/${project.slug}`, project.summary, { projectId: project.id }),
      document(`${HOME}/projects/${project.slug}/README.md`, projectReadme(project), {
        appId: 'project',
        projectId: project.id,
        description: project.summary,
      }),
    ]),
    document(`${HOME}/experiments/ai-lab/README.md`, projectReadme(projects[1]), {
      appId: 'project',
      projectId: 'ai-lab',
      description: 'How the local retrieval experiment works, including its limitations.',
    }),
    document(
      `${HOME}/writing/design notes.md`,
      '# Designing a desktop, not a disguise\n\n## One navigation model\nEvery application opens through the shared registry. A canonical virtual file path identifies a document, whether you reach it through Explorer or the shell. Project details are windows, not a second set of custom modals.\n\n## Conventional routes stay visible\nThe résumé, PDF, email, LinkedIn, and GitHub should never require a command or a puzzle. On phones, an explicit Open button replaces the desktop double-click convention.\n\n## Make experiments inspectable\nAI Lab uses local TF-IDF lexical retrieval and extractive evidence. It does not run a remote LLM or a semantic model. A failed match is useful information, not something to cover with a generated answer.\n\n## Honest provenance\nPinned repositories, recent repositories, and local fallback artifacts are different sources. The UI preserves that distinction. A repository description is not a license to invent architecture, impact, deployment, or availability.\n\n## Boundaries\nThis is a read-only virtual filesystem. There are no arbitrary host reads, remote HTML documents, or writable commands. Each window owns internal scrolling; resizing a window should not require resizing the browser.\n\nShell note: this filename contains a space. Quote paths such as "/home/cj/writing/design notes.md".',
      { description: 'Navigation, accessibility, honest evidence, and window-sized layouts.' }
    ),
    {
      path: `${HOME}/assets/portrait.jpeg`,
      name: 'portrait.jpeg',
      kind: 'file',
      mime: 'image/jpeg',
      assetUrl: '/images/photo.jpeg',
      appId: 'reader',
      description: 'Chiranjeev Singh’s portrait.',
    },
    {
      path: `${HOME}/assets/resume.pdf`,
      name: 'resume.pdf',
      kind: 'file',
      mime: 'application/pdf',
      assetUrl: '/resume/Chiranjeev-Singh-Resume.pdf',
      appId: 'reader',
      description: 'Original résumé PDF, available to open or download.',
    },
    document(
      `${HOME}/.secrets/treasure.map`,
      `# You found the builder’s layer\n\nThe treasure is not a password. It is a closer look at the things I build.\n\nOpen this map to enter the golden Vault application. Its artifacts come from the same shared feed as Project Explorer, with honest pinned / recent / fallback provenance.\n\nCurrent source: ${portfolioFeedLabel(feed)}.\n\nThe main route is always available: /home/cj/projects and /home/cj/resume.md. This side track never hides the résumé or contact links.`,
      {
        hidden: true,
        appId: 'vault',
        mime: 'text/plain',
        description: 'Open the optional golden builder layer.',
      }
    ),
  ];
}

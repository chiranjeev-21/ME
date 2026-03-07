import type {
  ExperienceItem,
  ProjectItem,
  SkillItem,
  StatItem,
  EducationItem,
  NavLink,
  HeroBadge,
  SocialLink,
} from '@/types';

// ─── Experience ────────────────────────────────────────────────────────────────

export const EXPERIENCE: ExperienceItem[] = [
  {
    id: 'amazon-jwo',
    company: 'Amazon',
    role: 'SDE — JWO Tech',
    period: '05/2025 — 02/2026',
    location: 'Bengaluru, India',
    logoInitial: 'A',
    logoVariant: 'amazon',
    highlights: [
      'Devised a <strong>runtime resource allocation service</strong> replacing hardcoded configs with S3-based caching, improving flexibility across <strong>10+ downstream services</strong> with 100% daemon uptime.',
      'Implemented <strong>Dynamic Size Limiting for IMOS</strong>, reducing SEV2 tickets by ~30% and improving Inquiry Dwell Time by up to <strong>23 minutes per rejected request</strong>.',
      'Migrated legacy grant management from Angular/CoffeeScript/Ruby to <strong>React + Polaris</strong> with 100% uptime, reducing engineering load by ~15%.',
      'Increased service success rate from <strong>85% → ~92%</strong> via a timeout-aware spillover mechanism, discarding delayed requests efficiently.',
      'Led internal <strong>AI/ML knowledge sessions</strong> on Neural Networks, Transformers & GenAI — attended by <strong>200+ employees</strong> across orgs.',
    ],
    tags: [
      'AWS S3',
      'React',
      'Polaris',
      'System Design',
      'LLM',
      'GenAI',
      'AWS SQS',
      'AWS CloudWatch',
      'Java',
      'JUnit',
      'Mockito',
    ],
  },
  {
    id: 'oyo-sde1',
    company: 'Oyo',
    role: 'SDE 1',
    period: '06/2024 — 04/2025',
    location: 'Gurugram, India',
    logoInitial: 'O',
    logoVariant: 'oyo',
    highlights: [
      'Led development of a <strong>Call Center Automation data pipeline</strong> using Azure ACS & Cognitive Services, driving a projected <strong>20% cost reduction</strong> for Belvilla and Dancenter.',
      'Built a <strong>voice processing pipeline</strong> achieving <strong>86% sentiment accuracy</strong> on 1,000+ clips, improving issue resolution by 20%.',
      'Optimized <strong>RAG workflows for chatbots</strong> across multiple brands, increasing search speed by 15% and handling <strong>2,000+ daily queries</strong> per department.',
    ],
    tags: [
      'Azure ACS',
      'RAG',
      'NLP',
      'Langchain',
      'Multimodal',
      'Azure ML Studio',
      'Azure Functions',
      'Python',
      'Voice Engineering',
    ],
  },
  {
    id: 'oyo-intern',
    company: 'Oyo',
    role: 'SDE Intern',
    period: '01/2024 — 06/2024',
    location: 'Gurugram, India',
    logoInitial: 'O',
    logoVariant: 'oyo',
    highlights: [
      'Engineered <strong>spatial clustering pipelines</strong> using DBSCAN & HDBSCAN to identify fraudulent bookings with a <strong>4:1 True/False positive ratio</strong>.',
      'Developed a <strong>GenAI pipeline for hero image selection</strong> using advanced masking, contributing to a <strong>20% increase in hotel booking conversion rates</strong>.',
    ],
    tags: ['DBSCAN', 'HDBSCAN', 'GenAI', 'Computer Vision', 'Python'],
  },
  {
    id: 'samsung-intern',
    company: 'Samsung',
    role: 'Research Intern',
    period: '10/2022 — 06/2023',
    location: 'Samsung R&D Institute',
    logoInitial: 'S',
    logoVariant: 'samsung',
    highlights: [
      'Led implementation of <strong>data workflows for Keyframe Extraction and Summarization</strong> in large-scale video datasets, coordinating a team of four researchers.',
    ],
    tags: ['Computer Vision', 'Video ML', 'Data Pipelines', 'Research'],
  },
];

// ─── Projects ──────────────────────────────────────────────────────────────────

export const PROJECTS: ProjectItem[] = [
  {
    id: 'multimodal-rag',
    title: 'Multimodal RAG System',
    description:
      'Optimized retrieval-augmented generation workflows across multiple Oyo brands — 15% speed gain handling 2,000+ daily queries with Langchain & Azure.',
    tag: 'AI · Agentic Workflows',
    gradientVariant: 'violet',
    featured: true,
  },
  {
    id: 'spatial-fraud',
    title: 'Spatial Fraud Detection',
    description:
      'DBSCAN & HDBSCAN clustering pipeline identifying fraudulent hotel bookings with a 4:1 true-to-false positive ratio at scale.',
    tag: 'ML · Fraud Detection',
    gradientVariant: 'indigo',
  },
  {
    id: 'face-mask-detection',
    title: 'Real-Time Face-Mask Detection',
    description:
      'YOLO-based system for detecting mask offenders in real-time via camera surveillance. Published with Intellectual Property India, 2022.',
    tag: 'CV · Publication',
    gradientVariant: 'crimson',
  },
];

// ─── Hero Skills ───────────────────────────────────────────────────────────────

export const HERO_SKILLS: SkillItem[] = [
  { label: 'Agentic AI', hot: true },
  { label: 'LLM / RAG', hot: true },
  { label: 'Java', hot: true },
  { label: 'Python', hot: true },
  { label: 'JavaScript' },
  { label: 'Node.js' },
  { label: 'FastAPI' },
  { label: 'AWS' },
  { label: 'PyTorch' },
  { label: 'Kafka' },
  { label: 'Docker' },
  { label: 'System Design' },
];

// ─── Hero Badges ───────────────────────────────────────────────────────────────

export const HERO_BADGES: HeroBadge[] = [
  {
    id: 'amazon',
    icon: '☁',
    title: 'Amazon SDE',
    subtitle: 'JWO Tech · Bengaluru',
    iconVariant: 'gold',
    position: 'topLeft',
  },
  {
    id: 'ai',
    icon: '⚡',
    title: 'AI / ML Focus',
    subtitle: 'LLMs · Agentic · RAG',
    iconVariant: 'purple',
    position: 'right',
  },
  {
    id: 'open',
    icon: '✦',
    title: 'Open to Work',
    subtitle: 'Remote · Worldwide',
    iconVariant: 'pink',
    position: 'bottomLeft',
  },
];

// ─── Stats ─────────────────────────────────────────────────────────────────────

export const STATS: StatItem[] = [
  { value: '2', suffix: '+', label: 'Years Experience' },
  { value: '2', label: 'Companies' },
  { value: '9.30', label: 'CGPA · Thapar' },
  { value: '200', suffix: '+', label: 'AI Session Attendees' },
];

// ─── Education & Certifications ────────────────────────────────────────────────

export const EDUCATION: EducationItem[] = [
  {
    id: 'thapar',
    icon: '🎓',
    title: 'Thapar Institute of Engineering & Technology',
    subtitle: 'B.E. Computer Science · <strong>9.30 CGPA</strong> · 2020–2024',
  },
  {
    id: 'azure',
    icon: '☁',
    title: 'Microsoft Azure Data Scientist Associate',
    subtitle: 'Certified · <strong>AI-900 · Nanodegrees</strong>',
  },
  {
    id: 'aws',
    icon: '🏆',
    title: 'AWS AI/ML Scholar',
    subtitle: 'Udacity Winter Cohort · <strong>Top 500 worldwide</strong>',
  },
];

// ─── Navigation ────────────────────────────────────────────────────────────────

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '#hero' },
  { label: 'Experience', href: '#work' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact Me', href: '#cta', cta: true },
];

// ─── Contact / Social ──────────────────────────────────────────────────────────

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'LinkedIn', href: 'https://linkedin.com/in/chiranjeev2101' },
  { label: 'GitHub', href: 'https://github.com/chiranjeev-21' },
];

export const EMAIL = 'chiranjeev21012003@gmail.com';

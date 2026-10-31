import type { EducationItem, ExperienceItem, SkillItem, SocialLink } from './types.ts';

// ─── Experience ────────────────────────────────────────────────────────────────

export const EXPERIENCE: ExperienceItem[] = [
  {
    id: 'microsoft-azure',
    company: 'Microsoft',
    role: 'Software Engineer · L60',
    period: '04/2026 — Present',
    location: 'Bengaluru, India',
    highlights: [
      'Working on <strong>Azure Direct Drive</strong>, with a focus on distributed computing, storage reliability, and performance.',
      'Built anomaly detection for Blips & Pauses, improving detection of unexplained IO latency anomalies by <strong>~20%</strong> using large-scale telemetry and unsupervised ML. Developed a release comparison framework across IO latency, workload, and network metrics.',
      'Contributed to overprovisioning and capacity throttling mechanisms, improving resource utilization efficiency by <strong>~15%</strong> under bursty IO workloads.',
      'Developed and validated <strong>Per-Disk Policy</strong> for automatic disk recovery on IO timeouts (E17), reducing VM downtime scenarios by <strong>~80% in failure testing</strong>.',
      'Worked on distributed storage architecture involving <strong>slice-based replication</strong> and Block Storage Services (BSS), strengthening durability and reliability.',
    ],
    tags: [
      'Distributed Computing',
      'Azure',
      'Direct Drive',
      'Distributed Storage',
      'Telemetry',
      'Unsupervised ML',
      'System Design',
    ],
  },
  {
    id: 'amazon-jwo',
    company: 'Amazon',
    role: 'SDE — JWO Tech',
    period: '05/2025 — 02/2026',
    location: 'Bengaluru, India',
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
    period: '07/2024 — 04/2025',
    location: 'Gurugram, India',
    highlights: [
      'Led development of a <strong>Call Center Automation data pipeline</strong> using Azure ACS & Cognitive Services, driving a projected <strong>20% cost reduction</strong> for Belvilla and Dancenter.',
      'Built a <strong>voice processing pipeline</strong> achieving <strong>86% sentiment accuracy</strong> on 1,000+ clips, improving issue resolution by 20%.',
      'Improved digital audit efficiency by optimizing and migrating pipelines, boosting performance and reducing latency.',
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
    period: '01/2024 — 07/2024',
    location: 'Gurugram, India',
    highlights: [
      'Engineered <strong>spatial clustering pipelines</strong> using DBSCAN & HDBSCAN to identify fraudulent bookings with a <strong>4:1 True/False positive ratio</strong>.',
      'Developed a <strong>GenAI pipeline for hero image selection</strong> using advanced masking, contributing to a <strong>20% increase in hotel booking conversion rates</strong>.',
    ],
    tags: ['DBSCAN', 'HDBSCAN', 'GenAI', 'Computer Vision', 'Python'],
  },
];

// ─── Research artifact (from the original portfolio) ──────────────────────────

export const RESEARCH_ARTIFACT = {
  id: 'face-mask-detection',
  title: 'Real-Time Face-Mask Detection',
  description:
    'YOLO-based system for detecting mask offenders in real-time via camera surveillance. Published with Intellectual Property India, 2022.',
  href: 'https://drive.google.com/drive/u/1/folders/1Kzb7cPkzDbj38a8uRQgOvbUnCQTpJK8Z',
} as const;

// ─── Skills ───────────────────────────────────────────────────────────────

export const SKILLS: SkillItem[] = [
  { label: 'Distributed Computing', hot: true },
  { label: 'Azure', hot: true },
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

// ─── Education & Certifications ────────────────────────────────────────────────

export const EDUCATION: EducationItem[] = [
  {
    id: 'thapar',
    title: 'Thapar Institute of Engineering & Technology',
    subtitle: 'B.E. Computer Science · <strong>9.30 CGPA</strong> · 2020–2024',
  },
  {
    id: 'merit',
    title: 'Merit Scholarship, Thapar Institute',
    subtitle: 'Outstanding academic performance · <strong>four years running</strong>, 2020–2024',
  },
  {
    id: 'azure',
    title: 'Microsoft Azure Data Scientist Associate',
    subtitle: 'Certified · <strong>Azure AI Fundamentals (AI-900)</strong>',
  },
  {
    id: 'aws',
    title: 'AWS AI/ML Scholar',
    subtitle: 'Udacity Winter Cohort · <strong>Top 500 worldwide</strong>',
  },
];

// ─── Contact / Social ──────────────────────────────────────────────────────────

export const SOCIAL_LINKS: SocialLink[] = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/chiranjeev-singh-2a012b219/' },
  { label: 'GitHub', href: 'https://github.com/chiranjeev-21' },
];

export const EMAIL = 'chiranj33v.singh@gmail.com';

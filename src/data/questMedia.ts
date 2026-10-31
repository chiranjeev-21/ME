import type { ProjectImage } from './types.ts';

/** A real screenshot of the site a repository links to as its homepage. */
export interface SiteCapture {
  kind: 'site';
  /** Host the capture was taken from; it is only shown while the repository still links there. */
  host: string;
  captured: string;
  image: ProjectImage;
}

/** A verbatim slice of a repository file, common indentation removed. */
export interface SourceExcerpt {
  kind: 'source';
  path: string;
  startLine: number;
  comment: '//' | '#';
  lines: readonly string[];
}

export type QuestMedia = SiteCapture | SourceExcerpt;

const site = (name: string, host: string, title: string): SiteCapture => ({
  kind: 'site',
  host,
  captured: 'Oct 2026',
  image: {
    src: `/images/quests/${name}-2400.webp`,
    srcSmall: `/images/quests/${name}-1200.webp`,
    width: 2400,
    height: 1500,
    alt: `${title}’s live site at ${host}, as captured in October 2026.`,
  },
});

// Keyed by lower-cased repository name. Screenshots were captured from each
// repository's homepage; excerpts were copied from the default branch (October 2026).
const MEDIA = new Map<string, QuestMedia>([
  ['whodis', site('whodis', 'whodis-fawn.vercel.app', 'WhoDis')],
  ['interviewstack', site('interviewstack', 'interview-stack.vercel.app', 'InterviewStack')],
  [
    'token-generator',
    site('token-generator', 'token-generator-woad.vercel.app', 'Token-generator'),
  ],
  [
    'decentralised-package-manager',
    {
      kind: 'source',
      path: 'internal/swarm/swarm.go',
      startLine: 95,
      comment: '//',
      lines: [
        '// Fan out: ask all peers simultaneously, return first hit.',
        'type result struct {',
        '    addr   string',
        '    reader io.ReadCloser',
        '    ct     string',
        '    err    error',
        '    hash   string',
        '}',
        '',
        'ch := make(chan result, len(activePeers))',
        '',
        'for _, p := range activePeers {',
        '    go func(addr string) {',
        '        res, err := s.client.Fetch([]string{addr}, cacheKey)',
        '        if err != nil {',
        '            ch <- result{addr: addr, err: err}',
        '            return',
        '        }',
        '        ch <- result{',
        '            addr:   addr,',
        '            reader: res.Body,',
        '            ct:     res.ContentType,',
        '            hash:   res.Hash,',
        '        }',
        '    }(p)',
        '}',
      ],
    },
  ],
  [
    'leetcode',
    {
      kind: 'source',
      path: 'binary-tree-cameras/1886915646.cpp',
      startLine: 53,
      comment: '//',
      lines: [
        'int cameras=0;',
        'int f(TreeNode* root){',
        '    if(!root){',
        '        return 2; // Null nodes are covered',
        '    }',
        '    int left = f(root->left);',
        '    int right = f(root->right);',
        '',
        '    //One Node is not covered',
        '    if(left==0 || right==0){',
        '        cameras++;',
        '        return 1;',
        '    }',
        '',
        "    //This node can be covered by the camera placed on it's children",
        '    if(left==1 || right==1){',
        '        return 2;',
        '    }',
        '',
        '    //Both children covered',
        '    return 0;',
        '}',
      ],
    },
  ],
  [
    'distributed-task-queue-and-job-processor',
    {
      kind: 'source',
      path: 'worker/worker.py',
      startLine: 77,
      comment: '#',
      lines: [
        'def fetch_and_lease_job(db):',
        '    result = db.execute(text("""',
        '        UPDATE jobs',
        '        SET',
        "            status = 'RUNNING',",
        '            worker_id = :worker_id,',
        '            lease_until = :lease_until',
        '        WHERE job_id = (',
        '            SELECT job_id FROM jobs',
        '            WHERE',
        '                (',
        "                    status = 'PENDING'",
        "                    OR (status = 'RUNNING' AND lease_until < now())",
        '                )',
        '                AND (next_run_at IS NULL OR next_run_at <= now())',
        '            ORDER BY created_at',
        '            LIMIT 1',
        '            FOR UPDATE SKIP LOCKED',
        '        )',
        '        RETURNING job_id',
        '    """), {',
        '        "worker_id": WORKER_NAME,',
        '        "lease_until": datetime.utcnow() + timedelta(seconds=LEASE_TIME)',
        '    }).fetchone()',
      ],
    },
  ],
]);

function hostOf(url: string | undefined) {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

/**
 * The real visual for a repository, if one exists. A screenshot is only used
 * while the repository still points to the site it was captured from.
 */
export function questMedia(repository: string, homepage?: string): QuestMedia | undefined {
  const media = MEDIA.get(repository.trim().toLowerCase());
  if (media?.kind === 'site' && hostOf(homepage) !== media.host) return undefined;
  return media;
}

// GitHub linguist colours, used when the feed omits them (the unauthenticated REST feed does).
const LANGUAGE_COLOURS = new Map<string, string>([
  ['c', '#555555'],
  ['c++', '#f34b7d'],
  ['c#', '#178600'],
  ['go', '#00add8'],
  ['java', '#b07219'],
  ['javascript', '#f1e05a'],
  ['jupyter notebook', '#da5b0b'],
  ['kotlin', '#a97bff'],
  ['python', '#3572a5'],
  ['rust', '#dea584'],
  ['swift', '#f05138'],
  ['typescript', '#3178c6'],
]);

const HEX_COLOUR = /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i;

/** A safe CSS hex colour for a language: the feed's own, else GitHub's published one. */
export function languageColour(language?: string, colour?: string | null): string | undefined {
  if (colour && HEX_COLOUR.test(colour)) return colour;
  return language ? LANGUAGE_COLOURS.get(language.trim().toLowerCase()) : undefined;
}

import type { VfsEntry } from '../../types.ts';

const MAX_DOCUMENTS = 24;
const MAX_CHUNKS = 96;
const MAX_SOURCE_CHARACTERS = 16_000;
const MAX_CHUNK_CHARACTERS = 900;
const MAX_QUERY_CHARACTERS = 400;
const MAX_RESULTS = 8;

const STOP_WORDS = new Set(
  (
    'a an and are as at be been being by can could did do does for from had has have ' +
    'how i in into is it its me my of on or our please show tell than that the their ' +
    'them there these they this those to us use used uses using was we were what ' +
    'when where which who why will with would you your'
  ).split(' ')
);

export interface SourceChunk {
  id: string;
  sourcePath: string;
  title: string;
  text: string;
  part: number;
}

interface ChunkVector {
  chunk: SourceChunk;
  weights: ReadonlyMap<string, number>;
  norm: number;
}

export interface RetrievalIndex {
  chunks: readonly SourceChunk[];
  documentCount: number;
  truncated: boolean;
  inverseDocumentFrequency: ReadonlyMap<string, number>;
  vectors: readonly ChunkVector[];
}

export interface SearchMatch {
  chunk: SourceChunk;
  score: number;
  matchedTerms: readonly string[];
  coverage: number;
}

export interface RetrievalResult {
  query: string;
  queryTerms: readonly string[];
  results: readonly SearchMatch[];
  matched: number;
  topScore: number;
  topK: number;
  status: 'empty-query' | 'empty-corpus' | 'no-match' | 'partial-match' | 'matched';
}

export interface ExtractiveAnswer {
  status: 'evidence' | 'abstain';
  explanation: string;
  evidence: readonly SearchMatch[];
}

export function normalizeText(text: string): string {
  return text.normalize('NFKC').replace(/\s+/gu, ' ').trim();
}

export function tokenize(text: string): string[] {
  const words = text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu);
  return (words ?? []).filter(word => word.length > 1 && !STOP_WORDS.has(word));
}

export function chunkText(text: string): string[] {
  let remainder = normalizeText(text.slice(0, MAX_SOURCE_CHARACTERS));
  const chunks: string[] = [];
  while (remainder) {
    let end = Math.min(remainder.length, MAX_CHUNK_CHARACTERS);
    if (end < remainder.length) {
      const boundary = remainder.lastIndexOf(' ', end);
      if (boundary > MAX_CHUNK_CHARACTERS / 2) end = boundary;
    }
    chunks.push(remainder.slice(0, end).trim());
    remainder = remainder.slice(end).trim();
  }
  return chunks;
}

function isPublicText(entry: VfsEntry, hiddenPaths: readonly string[]): boolean {
  if (entry.kind !== 'file' || entry.hidden || !entry.content?.trim()) return false;
  if (!entry.path.startsWith('/') || entry.path.split('/').some(part => part.startsWith('.'))) {
    return false;
  }
  if (hiddenPaths.some(path => entry.path === path || entry.path.startsWith(`${path}/`))) {
    return false;
  }
  return (
    !entry.mime ||
    entry.mime.startsWith('text/') ||
    /^(application\/(json|ld\+json|xml|javascript|x-yaml))(;|$)/i.test(entry.mime)
  );
}

export function createRetrievalIndex(files: readonly VfsEntry[]): RetrievalIndex {
  const hiddenPaths = files.filter(file => file.hidden).map(file => file.path.replace(/\/+$/, ''));
  const paths = new Set<string>();
  const chunks: SourceChunk[] = [];
  let truncated = false;
  for (const file of files) {
    if (!isPublicText(file, hiddenPaths) || paths.has(file.path)) continue;
    if (paths.size >= MAX_DOCUMENTS || chunks.length >= MAX_CHUNKS) {
      truncated = true;
      continue;
    }
    const text = file.content ?? '';
    const parts = chunkText(text);
    if (text.length > MAX_SOURCE_CHARACTERS) truncated = true;
    if (!parts.length) continue;
    paths.add(file.path);
    for (let part = 0; part < parts.length; part += 1) {
      if (chunks.length >= MAX_CHUNKS) {
        truncated = true;
        break;
      }
      chunks.push({
        id: `${file.path}#${part + 1}`,
        sourcePath: file.path,
        title: file.name,
        text: parts[part],
        part: part + 1,
      });
    }
  }

  const counts = chunks.map(chunk => {
    const terms = new Map<string, number>();
    for (const term of tokenize(chunk.text)) terms.set(term, (terms.get(term) ?? 0) + 1);
    return terms;
  });
  const frequencies = new Map<string, number>();
  for (const terms of counts) {
    for (const term of terms.keys()) frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
  }
  const inverseDocumentFrequency = new Map<string, number>();
  for (const [term, count] of frequencies) {
    inverseDocumentFrequency.set(term, Math.log((chunks.length + 1) / (count + 1)) + 1);
  }
  const vectors = chunks.map((chunk, index) => {
    const weights = new Map<string, number>();
    let squaredNorm = 0;
    for (const [term, count] of counts[index]) {
      const weight = (1 + Math.log(count)) * (inverseDocumentFrequency.get(term) ?? 1);
      weights.set(term, weight);
      squaredNorm += weight * weight;
    }
    return { chunk, weights, norm: Math.sqrt(squaredNorm) };
  });
  return {
    chunks,
    documentCount: paths.size,
    truncated,
    inverseDocumentFrequency,
    vectors,
  };
}

export function retrieve(index: RetrievalIndex, query: string, topK = 3): RetrievalResult {
  const boundedQuery = query.slice(0, MAX_QUERY_CHARACTERS);
  const queryTerms = [...new Set(tokenize(boundedQuery))];
  const limit = Number.isFinite(topK) ? Math.min(MAX_RESULTS, Math.max(1, Math.floor(topK))) : 3;
  const base = {
    query: boundedQuery,
    queryTerms,
    topK: limit,
    results: [],
    matched: 0,
    topScore: 0,
  };
  if (!queryTerms.length) return { ...base, status: 'empty-query' };
  if (!index.chunks.length) return { ...base, status: 'empty-corpus' };

  const queryWeights = new Map<string, number>();
  let querySquaredNorm = 0;
  for (const term of queryTerms) {
    // Unknown terms still contribute to the norm, rather than disappearing from the question.
    const weight =
      index.inverseDocumentFrequency.get(term) ?? Math.log(index.chunks.length + 1) + 1;
    queryWeights.set(term, weight);
    querySquaredNorm += weight * weight;
  }
  const queryNorm = Math.sqrt(querySquaredNorm);
  const candidates: SearchMatch[] = [];
  for (const vector of index.vectors) {
    if (!vector.norm || !queryNorm) continue;
    let dot = 0;
    const matchedTerms: string[] = [];
    for (const [term, weight] of queryWeights) {
      const sourceWeight = vector.weights.get(term);
      if (sourceWeight !== undefined) {
        dot += weight * sourceWeight;
        matchedTerms.push(term);
      }
    }
    const score = Math.min(1, Math.max(0, dot / (queryNorm * vector.norm)));
    if (Number.isFinite(score) && score > 0) {
      candidates.push({
        chunk: vector.chunk,
        score,
        matchedTerms,
        coverage: matchedTerms.length / queryTerms.length,
      });
    }
  }
  candidates.sort(
    (left, right) => right.score - left.score || left.chunk.id.localeCompare(right.chunk.id, 'en')
  );
  const results = candidates.slice(0, limit);
  return {
    ...base,
    results,
    matched: candidates.length,
    topScore: results[0]?.score ?? 0,
    status: !results.length
      ? 'no-match'
      : results.some(result => result.coverage === 1)
        ? 'matched'
        : 'partial-match',
  };
}

export function extractEvidence(result: RetrievalResult): ExtractiveAnswer {
  const reasons = {
    'empty-query':
      'Enter some searchable words. Punctuation and common question words are ignored.',
    'empty-corpus':
      'There are no public text files to search. Open Explorer to inspect the workspace.',
    'no-match':
      'No lexical matches were found in this corpus. There is no evidence here to answer this query.',
    'partial-match':
      'Only partial keyword matches were found. No returned chunk contains every query term, so no answer is inferred.',
    matched: '',
  };
  const evidence = result.results.filter(match => match.coverage === 1).slice(0, 3);
  if (result.status !== 'matched' || !evidence.length) {
    return { status: 'abstain', explanation: reasons[result.status], evidence: [] };
  }
  return {
    status: 'evidence',
    explanation:
      'Exact source excerpts containing all searchable query terms. Keyword overlap is not factual verification; these quotes may not answer the question.',
    evidence,
  };
}

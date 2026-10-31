export interface ResearchDocument {
  id: string;
  title: string;
  text: string;
  href: string;
}
export interface ResearchMatch {
  document: ResearchDocument;
  score: number;
  terms: string[];
  excerpt: string;
}
export interface ResearchResult {
  terms: string[];
  matches: ResearchMatch[];
  indexed: number;
  abstained: boolean;
}
const STOP = new Set(
  'a an the and or to of in on for with is are was were be been being i my me you your we our what which who how why does do did can could would should use uses using about tell show has have at from as it its this that these those'.split(
    ' '
  )
);
export function researchTokens(text: string): string[] {
  return (
    text
      .normalize('NFKC')
      .toLowerCase()
      .match(/[\p{L}\p{N}][\p{L}\p{N}+#-]*/gu) || []
  )
    .map(word => (word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word))
    .filter(word => word.length > 1 && !STOP.has(word));
}
function frequencies(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  tokens.forEach(token => counts.set(token, (counts.get(token) || 0) + 1));
  return counts;
}
export function retrieveResearch(
  documents: readonly ResearchDocument[],
  query: string,
  topK = 3
): ResearchResult {
  const corpus = documents.filter(doc => doc.text.trim()).slice(0, 40);
  const terms = [...new Set(researchTokens(query.slice(0, 400)))].slice(0, 32);
  const counts = corpus.map(doc =>
    frequencies(researchTokens(`${doc.title} ${doc.text.slice(0, 14000)}`))
  );
  const documentFrequency = new Map<string, number>();
  counts.forEach(count =>
    count.forEach((_, term) => documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1))
  );
  const idf = (term: string) =>
    Math.log((corpus.length + 1) / ((documentFrequency.get(term) || 0) + 1)) + 1;
  const queryNorm = Math.sqrt(terms.reduce((total, term) => total + idf(term) ** 2, 0));
  const matches = corpus
    .map((document, index) => {
      const count = counts[index];
      let norm = 0;
      count.forEach((frequency, term) => {
        norm += ((1 + Math.log(frequency)) * idf(term)) ** 2;
      });
      const overlap = terms.filter(term => count.has(term));
      const dot = overlap.reduce(
        (total, term) => total + (1 + Math.log(count.get(term)!)) * idf(term) ** 2,
        0
      );
      const score =
        queryNorm && norm ? Math.max(0, Math.min(1, dot / (queryNorm * Math.sqrt(norm)))) : 0;
      const paragraphs = document.text.split(/\n\s*\n|(?<=[.!?])\s+/).filter(Boolean);
      const best =
        paragraphs.sort((left, right) => {
          const hits = (value: string) =>
            terms.filter(term => researchTokens(value).includes(term)).length;
          return hits(right) - hits(left);
        })[0] || document.text;
      return { document, score, terms: overlap, excerpt: best.slice(0, 1000) };
    })
    .filter(match => match.score > 0 && match.terms.length > 0)
    .sort((a, b) => b.score - a.score || a.document.id.localeCompare(b.document.id))
    .slice(0, Math.max(1, Math.min(6, Number.isFinite(topK) ? Math.floor(topK) : 3)));
  return { terms, matches, indexed: corpus.length, abstained: !matches.length };
}

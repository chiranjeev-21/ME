const { test, before } = require('node:test');
const assert = require('node:assert/strict');
let retrieveResearch;
before(async () => ({ retrieveResearch } = await import('../src/lib/retrieval.ts')));
const docs = [
  {
    id: 'storage',
    title: 'Distributed storage',
    text: 'Storage replication and disk recovery address failures in distributed systems.',
    href: '/projects/storage',
  },
  {
    id: 'retrieval',
    title: 'Retrieval evidence',
    text: 'Lexical retrieval ranks public documents. Source evidence is quoted, not generated.',
    href: '/writing/retrieval',
  },
  {
    id: 'creative',
    title: 'Creative experiments',
    text: 'A seeded contour drawing uses original procedural artwork and a palette.',
    href: '/world/creative',
  },
];
test('different queries compute different relevant source rankings', () => {
  assert.equal(retrieveResearch(docs, 'disk recovery').matches[0].document.id, 'storage');
  assert.equal(retrieveResearch(docs, 'retrieval evidence').matches[0].document.id, 'retrieval');
  assert.equal(retrieveResearch(docs, 'contour palette').matches[0].document.id, 'creative');
});
test('empty corpus, empty input and unsupported questions abstain without fabricated output', () => {
  for (const [corpus, query] of [
    [[], 'storage'],
    [docs, 'the and what'],
    [docs, 'zxqvflibbertigibbet'],
  ]) {
    const result = retrieveResearch(corpus, query);
    assert.equal(result.abstained, true);
    assert.deepEqual(result.matches, []);
  }
});
test('scores are finite cosine similarities and duplicate query words do not inflate them', () => {
  const single = retrieveResearch(docs, 'storage').matches[0];
  const repeated = retrieveResearch(docs, 'storage storage storage').matches[0];
  assert.equal(single.score, repeated.score);
  for (const match of retrieveResearch(docs, 'storage retrieval creative').matches) {
    assert.ok(Number.isFinite(match.score) && match.score > 0 && match.score <= 1);
    assert.ok(match.document.text.includes(match.excerpt));
  }
});
test('top-k and untrusted input sizes remain bounded without mutating source documents', () => {
  const before = JSON.stringify(docs);
  assert.equal(retrieveResearch(docs, 'storage retrieval creative', 1).matches.length, 1);
  assert.ok(retrieveResearch(docs, 'storage retrieval creative', NaN).matches.length <= 6);
  assert.equal(retrieveResearch(docs, 'storage '.repeat(10000)).terms.length, 1);
  assert.equal(JSON.stringify(docs), before);
});

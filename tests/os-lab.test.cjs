const { test } = require('node:test');
const assert = require('node:assert/strict');

const engine = import('../src/os/apps/lab/retrieval.ts');

function file(path, content, extra = {}) {
  return {
    path,
    name: path.split('/').at(-1),
    kind: 'file',
    mime: 'text/plain',
    content,
    ...extra,
  };
}

function fixture() {
  return [
    file(
      '/projects/search.txt',
      'Lexical retrieval uses TF-IDF and cosine similarity to rank source chunks.'
    ),
    file('/projects/vision.txt', 'Camera surveillance detects face masks with YOLO and OpenCV.'),
    file(
      '/skills/agents.txt',
      'Agentic AI coordinates planning and tool use. This skill is separate from lexical retrieval.'
    ),
  ];
}

test('real lexical overlap ranks the relevant source and changes with the query', async () => {
  const { createRetrievalIndex, retrieve, extractEvidence } = await engine;
  const index = createRetrievalIndex(fixture());
  const search = retrieve(index, 'How does cosine retrieval rank chunks?', 2);
  const vision = retrieve(index, 'YOLO face masks', 2);
  assert.equal(search.results[0].chunk.sourcePath, '/projects/search.txt');
  assert.equal(vision.results[0].chunk.sourcePath, '/projects/vision.txt');
  assert.ok(search.topScore > 0 && search.topScore <= 1);
  assert.ok(
    search.results.every(
      (entry, position, entries) => !position || entries[position - 1].score >= entry.score
    )
  );
  const answer = extractEvidence(vision);
  assert.equal(answer.status, 'evidence');
  assert.equal(answer.evidence[0].chunk.text, fixture()[1].content);
});

test('empty corpus, empty normalized query, unknown terms and zero-norm text abstain safely', async () => {
  const { createRetrievalIndex, retrieve, extractEvidence } = await engine;
  const index = createRetrievalIndex(fixture());
  for (const [corpus, query, status] of [
    [createRetrievalIndex([]), 'retrieval', 'empty-corpus'],
    [index, '  ??? the AND how  ', 'empty-query'],
    [index, 'interplanetary cryptocurrency', 'no-match'],
    [createRetrievalIndex([file('/stop.txt', 'the and is a')]), 'retrieval', 'no-match'],
  ]) {
    const result = retrieve(corpus, query);
    assert.equal(result.status, status);
    assert.deepEqual(result.results, []);
    assert.equal(result.topScore, 0);
    assert.equal(result.matched, 0);
    assert.equal(extractEvidence(result).status, 'abstain');
  }
});

test('unknown content words lower similarity and partial matches do not become an answer', async () => {
  const { createRetrievalIndex, retrieve, extractEvidence } = await engine;
  const index = createRetrievalIndex(fixture());
  const supported = retrieve(index, 'cosine retrieval');
  const unsupported = retrieve(index, 'cosine retrieval interplanetary');
  assert.ok(unsupported.results.length > 0);
  assert.ok(unsupported.topScore < supported.topScore);
  assert.equal(unsupported.status, 'partial-match');
  assert.equal(extractEvidence(unsupported).status, 'abstain');
  assert.deepEqual(extractEvidence(unsupported).evidence, []);
});

test('query terms are Unicode-normalized and deduplicated without score inflation', async () => {
  const { createRetrievalIndex, retrieve, tokenize } = await engine;
  const index = createRetrievalIndex([
    file('/notes/cafe.txt', 'Café retrieval with cosine ranking.'),
  ]);
  assert.deepEqual(tokenize('CAFÉ, ＲＥＴＲＩＥＶＡＬ!'), ['cafe', 'retrieval']);
  const ordinary = retrieve(index, 'cafe retrieval');
  const repeated = retrieve(index, 'CAFÉ cafe RETRIEVAL retrieval retrieval');
  assert.equal(repeated.topScore, ordinary.topScore);
  assert.deepEqual(repeated.queryTerms, ordinary.queryTerms);
  assert.equal(repeated.status, 'matched');
});

test('top-k is bounded, finite, and does not change the actual positive-match count', async () => {
  const { createRetrievalIndex, retrieve } = await engine;
  const index = createRetrievalIndex(
    Array.from({ length: 12 }, (_, number) =>
      file(`/notes/${number}.txt`, `Retrieval source number ${number} with cosine similarity.`)
    )
  );
  for (const [requested, expected] of [
    [1, 1],
    [4, 4],
    [1000, 8],
    [-9, 1],
    [2.8, 2],
    [NaN, 3],
    [Infinity, 3],
  ]) {
    const result = retrieve(index, 'retrieval', requested);
    assert.equal(result.results.length, expected);
    assert.equal(result.matched, 12);
    assert.ok(Number.isFinite(result.topScore));
    for (const match of result.results) {
      assert.ok(Number.isFinite(match.score) && match.score > 0 && match.score <= 1);
      assert.ok(Number.isFinite(match.coverage) && match.coverage > 0 && match.coverage <= 1);
    }
  }
  assert.deepEqual(retrieve(index, 'retrieval', 4), retrieve(index, 'retrieval', 4));
});

test('only public readable files are indexed and duplicate source paths do not skew rankings', async () => {
  const { createRetrievalIndex, retrieve } = await engine;
  const files = [
    file('/public.txt', 'Cosine retrieval evidence.'),
    file('/public.txt', 'Duplicate source must not count twice.'),
    file('/secret.txt', 'Cosine retrieval secret.', { hidden: true }),
    { path: '/vault', name: 'vault', kind: 'directory', hidden: true },
    file('/vault/inside.txt', 'Cosine retrieval hidden descendant.'),
    file('/.private.txt', 'Cosine retrieval hidden dotfile.'),
    file('/image.png', 'Cosine retrieval binary.', { mime: 'image/png' }),
    file('/empty.txt', '  '),
    { path: '/asset.pdf', name: 'asset.pdf', kind: 'file', mime: 'application/pdf' },
  ];
  const index = createRetrievalIndex(files);
  assert.equal(index.documentCount, 1);
  assert.equal(index.chunks.length, 1);
  assert.equal(retrieve(index, 'retrieval').matched, 1);
  assert.equal(retrieve(index, 'secret').status, 'no-match');
});

test('large inputs are bounded and split into inspectable chunks with real source paths', async () => {
  const { createRetrievalIndex, retrieve, chunkText } = await engine;
  const content = 'retrieval '.repeat(4000);
  const chunks = chunkText(content);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every(chunk => chunk.length > 0 && chunk.length <= 900));
  const index = createRetrievalIndex(
    Array.from({ length: 40 }, (_, number) => file(`/notes/${number}.txt`, content))
  );
  assert.equal(index.truncated, true);
  assert.ok(index.documentCount <= 24);
  assert.ok(index.chunks.length <= 96);
  const result = retrieve(index, 'retrieval', 8);
  assert.equal(new Set(result.results.map(match => match.chunk.id)).size, result.results.length);
  assert.ok(
    result.results.every(
      match => match.chunk.sourcePath.startsWith('/notes/') && Number.isFinite(match.score)
    )
  );
  const smallFiles = createRetrievalIndex(
    Array.from({ length: 40 }, (_, number) => file(`/small/${number}.txt`, 'retrieval'))
  );
  assert.equal(smallFiles.documentCount, 24);
  assert.equal(smallFiles.truncated, true);
  const blankPrefix = createRetrievalIndex([
    file('/beyond-bound.txt', `${' '.repeat(16_000)}retrieval`),
  ]);
  assert.equal(blankPrefix.documentCount, 0);
  assert.equal(blankPrefix.chunks.length, 0);
  assert.equal(blankPrefix.truncated, true);
  const boundedQuery = retrieve(smallFiles, `${'retrieval '.repeat(40)}unsupported`);
  assert.ok(boundedQuery.query.length <= 400);
  assert.equal(boundedQuery.status, 'matched');
});

test('question terms distributed across unrelated sources are not synthesized into an answer', async () => {
  const { createRetrievalIndex, retrieve, extractEvidence } = await engine;
  const index = createRetrievalIndex([
    file('/a.txt', 'Agentic AI plans tool execution.'),
    file('/b.txt', 'YOLO detects masks in images.'),
  ]);
  const result = retrieve(index, 'Agentic YOLO');
  assert.equal(result.matched, 2);
  assert.equal(result.status, 'partial-match');
  assert.equal(extractEvidence(result).status, 'abstain');
});

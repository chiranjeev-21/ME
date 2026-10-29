const assert = require('node:assert/strict');
const { before, test } = require('node:test');

let executeCommand;
let completeCommand;
let parseCommand;
let normalizePath;
let getEntry;
let listDirectory;
let readFile;

before(async () => {
  ({ executeCommand, completeCommand, parseCommand } =
    await import('../src/os/terminal/engine.ts'));
  ({ normalizePath, getEntry, listDirectory, readFile } =
    await import('../src/os/terminal/vfs.ts'));
});

const apps = [
  { id: 'terminal', title: 'Terminal', description: 'A virtual shell.' },
  { id: 'explorer', title: 'Project Explorer', description: 'Browse the supplied workspace.' },
  { id: 'project', title: 'Project Investigation', description: 'A project case study.' },
  { id: 'reader', title: 'Document', description: 'Read supplied documents.' },
  { id: 'resume', title: 'Resume', description: 'Experience and contact.' },
  { id: 'lab', title: 'AI Lab', description: 'Inspect the retrieval experiment.' },
  { id: 'monitor', title: 'System Monitor', description: 'Real browser measurements.' },
  { id: 'vault', title: 'Hidden Vault', description: 'An extra layer.' },
];
const projects = [
  {
    id: 'project-ai',
    slug: 'ai-lab',
    title: 'Retrieval Workbench',
    summary: 'A local retrieval experiment.',
  },
  { id: 'project-notes', slug: 'notes', title: 'Notes Project', summary: 'A small notes project.' },
];
const files = [
  {
    path: '/home/cj/projects/ai-lab/README.md',
    name: 'README.md',
    kind: 'file',
    content: '# AI Lab\nInspect the retrieval pipeline.',
  },
  { path: '/home/cj/notes with spaces', name: 'notes with spaces', kind: 'directory' },
  {
    path: '/home/cj/notes with spaces/day one.txt',
    name: 'day one.txt',
    kind: 'file',
    content: 'First note.',
  },
  {
    path: "/home/cj/notes with spaces/cj's notes.txt",
    name: "cj's notes.txt",
    kind: 'file',
    content: 'Quoted name.',
  },
  {
    path: '/home/cj/about.md',
    name: 'about.md',
    kind: 'file',
    content: 'Chiranjeev Singh — Microsoft / Azure Direct Drive.',
  },
  {
    path: '/home/cj/contact.md',
    name: 'contact.md',
    kind: 'file',
    content: 'Contact details from the workspace.',
  },
  { path: '/home/cj/empty.txt', name: 'empty.txt', kind: 'file', content: '' },
  { path: '/home/cj/.vault', name: '.vault', kind: 'file', content: 'A hint.' },
  {
    path: '/home/cj/quiet.md',
    name: 'quiet.md',
    kind: 'file',
    hidden: true,
    content: 'Hidden by metadata.',
  },
  { path: '/home/cj/resume.pdf', name: 'resume.pdf', kind: 'file', assetUrl: '/resume.pdf' },
];
const context = (overrides = {}) => ({ cwd: '/home/cj', apps, projects, files, ...overrides });
const run = (command, overrides) => executeCommand(command, context(overrides));
const text = result => result.lines.map(line => line.text).join('\n');

test('parser handles mixed quotes, empty arguments, escaped spaces, and literal backslashes', () => {
  assert.deepEqual(parseCommand(`echo "hello world" 'single "quotes"' one\\ two ""`), [
    'echo',
    'hello world',
    'single "quotes"',
    'one two',
    '',
  ]);
  assert.deepEqual(parseCommand(String.raw`echo C:\\notes "a\\b" 'a\b' pre"two words"post`), [
    'echo',
    'C:\\notes',
    'a\\b',
    'a\\b',
    'pretwo wordspost',
  ]);
  assert.deepEqual(parseCommand(String.raw`echo "a\"b" "\q" escaped\|pipe`), [
    'echo',
    'a"b',
    '\\q',
    'escaped|pipe',
  ]);
  assert.deepEqual(parseCommand(` \t `), []);
});

test('parser rejects unfinished input with useful errors instead of executing a prefix', () => {
  assert.throws(() => parseCommand(`cat "unfinished`), /Unterminated double quote/);
  assert.throws(() => parseCommand(`echo 'unfinished`), /Unterminated single quote/);
  assert.throws(() => parseCommand('echo trailing\\'), /Trailing escape/);
  for (const source of [
    'open resume | cat',
    'open resume && exit',
    'echo a; exit',
    'cat < file',
    'echo > file',
    'echo `pwd`',
    'echo $(pwd)',
    'pwd\nexit',
    'pwd\r\nexit',
  ]) {
    const result = run(source);
    assert.match(text(result), /Unsupported shell operator/);
    assert.deepEqual(result.effects, []);
  }
  assert.equal(text(run(`echo 'a|b' "x > y" escaped\\;symbol`)), 'a|b x > y escaped;symbol');
});

test('normalization expands home, resolves relative paths, retains spaces, and clamps traversal', () => {
  assert.equal(
    normalizePath('~/projects//ai-lab/./README.md'),
    '/home/cj/projects/ai-lab/README.md'
  );
  assert.equal(
    normalizePath('../notes with spaces/day one.txt', '/home/cj/projects'),
    '/home/cj/notes with spaces/day one.txt'
  );
  assert.equal(normalizePath('../../../../../../etc/passwd'), '/etc/passwd');
  assert.equal(normalizePath('/../.././'), '/');
  assert.equal(normalizePath(''), '/home/cj');
  assert.equal(normalizePath('..', '/'), '/');
  assert.equal(normalizePath('~'), '/home/cj');
  assert.equal(normalizePath('~/../cj/empty.txt', '/elsewhere'), '/home/cj/empty.txt');
});

test('virtual directories are inferred from supplied paths and never read host files', () => {
  assert.equal(getEntry(files, '~/projects').kind, 'directory');
  assert.equal(getEntry(files, '/').kind, 'directory');
  assert.deepEqual(
    listDirectory(files, '~/projects/ai-lab').map(entry => entry.name),
    ['README.md']
  );
  assert.equal(readFile(files, '~/empty.txt'), '');
  assert.throws(() => readFile(files, '/etc/passwd'), /No such file or directory/);
  assert.throws(() => listDirectory(files, '~/about.md'), /Not a directory/);
  assert.throws(() => readFile(files, '~/projects'), /Is a directory/);
  assert.throws(() => readFile(files, '~/resume.pdf'), /Not a text-readable file.*Use open/);
});

test('cd, ls, and cat operate on the current virtual directory, including spaces', () => {
  const changed = run(`cd "notes with spaces"`);
  assert.equal(changed.cwd, '/home/cj/notes with spaces');
  assert.equal(text(run('cat day\\ one.txt', { cwd: changed.cwd })), 'First note.');
  assert.equal(run('cd ..', { cwd: changed.cwd }).cwd, '/home/cj');
  assert.equal(run('cd', { cwd: changed.cwd }).cwd, '/home/cj');
  assert.equal(
    text(run('cat ~/projects/ai-lab/README.md')),
    '# AI Lab\nInspect the retrieval pipeline.'
  );
  const listed = run('ls ~/projects/ai-lab');
  assert.equal(listed.lines[0].text, 'README.md');
  assert.deepEqual(listed.lines[0].action, {
    kind: 'path',
    path: '/home/cj/projects/ai-lab/README.md',
  });
  assert.equal(text(run('ls ~/about.md')), 'about.md');
  assert.equal(run('cd /../../../../').cwd, '/');
});

test('ls hides dotfiles and metadata-hidden entries unless -a is supplied', () => {
  assert.doesNotMatch(text(run('ls')), /\.vault|quiet\.md/);
  assert.match(text(run('ls -a')), /\.vault/);
  assert.match(text(run('ls -a .')), /quiet\.md/);
  assert.match(text(run('ls -- .')), /about\.md/);
  assert.match(text(run('ls -z')), /Unknown ls option/);
  assert.match(text(run('ls . projects')), /Usage: ls/);
});

test('failed file and directory operations leave cwd intact and emit no actions', () => {
  for (const [command, error] of [
    ['cd missing', /No such file or directory/],
    ['cd about.md', /Not a directory/],
    ['cat projects', /Is a directory/],
    ['cat missing', /No such file or directory/],
    ['ls missing', /No such file or directory/],
    ['cat', /Usage: cat/],
    ['cd one two', /Quote paths containing spaces/],
    ['cat ../../../../etc/passwd', /No such file or directory: \/etc\/passwd/],
  ]) {
    const result = run(command);
    assert.equal(result.cwd, '/home/cj');
    assert.match(text(result), error);
    assert.equal(result.lines[0].tone, 'error');
    assert.deepEqual(result.effects, []);
  }
});

test('open resolves registry ids and titles, project slugs, and canonical virtual paths', () => {
  assert.deepEqual(run('open lab').effects, [{ kind: 'app', appId: 'lab' }]);
  assert.deepEqual(run(`open "AI Lab"`).effects, [{ kind: 'app', appId: 'lab' }]);
  assert.deepEqual(run('open System Monitor').effects, [{ kind: 'app', appId: 'monitor' }]);
  assert.deepEqual(run('open ai-lab').effects, [
    { kind: 'app', appId: 'project', payload: { projectId: 'project-ai' } },
  ]);
  assert.deepEqual(run(`open "Notes Project"`).effects, [
    { kind: 'app', appId: 'project', payload: { projectId: 'project-notes' } },
  ]);
  assert.deepEqual(run('open ~/projects/ai-lab/../ai-lab/README.md').effects, [
    { kind: 'path', path: '/home/cj/projects/ai-lab/README.md' },
  ]);
  assert.deepEqual(run('open projects').effects, [
    { kind: 'app', appId: 'explorer', payload: { path: '/home/cj/projects' } },
  ]);
  assert.match(text(run('open nonexistent')), /no matching app, project, or virtual path/);
  assert.deepEqual(run('open nonexistent').effects, []);
  assert.match(
    text(run('lab', { apps: apps.filter(app => app.id !== 'lab') })),
    /Application unavailable/
  );
});

test('project listings and help use supplied descriptions and launchable structured actions', () => {
  const listing = run('projects');
  assert.match(text(listing), /Retrieval Workbench.*local retrieval experiment/);
  assert.deepEqual(listing.lines[0].action, {
    kind: 'app',
    appId: 'project',
    payload: { projectId: 'project-ai' },
  });
  const help = run('help');
  assert.match(text(help), /AI Lab — Inspect the retrieval experiment/);
  assert.deepEqual(help.lines.find(line => line.text.includes('AI Lab —')).action, {
    kind: 'app',
    appId: 'lab',
  });
  const directoryAction = run('ls').lines.find(line =>
    line.text.startsWith('notes with spaces/')
  ).action;
  assert.equal(run(directoryAction.command).cwd, '/home/cj/notes with spaces');
  assert.match(text(run('projects', { projects: [] })), /No project case studies/);
});

test('reader routes, secret routes, clear, history, and exit return explicit effects', () => {
  for (const command of ['about', 'contact']) {
    assert.deepEqual(run(command).effects, [
      { kind: 'app', appId: 'reader', payload: { path: `/home/cj/${command}.md` } },
    ]);
  }
  assert.deepEqual(run('resume').effects, [{ kind: 'app', appId: 'resume' }]);
  assert.deepEqual(run('monitor').effects, [{ kind: 'app', appId: 'monitor' }]);
  assert.deepEqual(run('open vault').effects, [{ kind: 'app', appId: 'vault' }]);
  assert.deepEqual(run('vault').effects, [{ kind: 'app', appId: 'vault' }]);
  assert.deepEqual(run('sudo hire cj').effects, [
    { kind: 'app', appId: 'reader', payload: { path: '/home/cj/contact.md' } },
  ]);
  assert.deepEqual(run('sudo rm anything').effects, []);
  assert.match(text(run('sudo rm anything')), /read-only/);
  assert.deepEqual(run('clear').effects, [{ kind: 'clear' }]);
  assert.deepEqual(run('exit').effects, [{ kind: 'close' }]);
  const history = run('history', { history: ['pwd', 'cat about.md'] });
  assert.match(text(history), /1  pwd/);
  assert.deepEqual(history.lines[1].action, { kind: 'command', command: 'cat about.md' });
  assert.match(text(run('whoami')), /Chiranjeev Singh/);
  assert.match(
    text(run('neofetch', { system: { hostname: 'test-workspace', version: '2.0' } })),
    /test-workspace · 2.0/
  );
});

test('completion expands shared command prefixes and registry/project actions', () => {
  assert.equal(completeCommand('who', context()).input, 'whoami ');
  assert.equal(completeCommand('h', context()).input, 'h');
  assert.deepEqual(
    completeCommand('h', context()).suggestions.map(item => item.value),
    ['help', 'history']
  );
  assert.equal(
    completeCommand('open AI', context()).suggestions.find(item => item.label === 'AI Lab')
      .description,
    'Inspect the retrieval experiment.'
  );
  const project = completeCommand('open ai-', context()).suggestions.find(
    item => item.value === 'ai-lab'
  );
  assert.deepEqual(run(project.input).effects, [
    { kind: 'app', appId: 'project', payload: { projectId: 'project-ai' } },
  ]);
  assert.deepEqual(run(completeCommand('open "System Mon', context()).input).effects, [
    { kind: 'app', appId: 'monitor' },
  ]);
});

test('completion handles home, spaces, apostrophes, inferred directories, and hidden files', () => {
  assert.equal(completeCommand('cd ~', context()).input, 'cd ~/');
  assert.equal(completeCommand('cd ~/proj', context()).input, 'cd ~/projects/');
  assert.equal(
    completeCommand('cat ~/projects/ai-lab/READ', context()).input,
    'cat ~/projects/ai-lab/README.md '
  );
  const spaced = completeCommand('cd notes', context());
  assert.deepEqual(parseCommand(spaced.input), ['cd', 'notes with spaces/']);
  assert.equal(run(spaced.input).cwd, '/home/cj/notes with spaces');
  const quoted = completeCommand(`cat "cj`, context({ cwd: '/home/cj/notes with spaces' }));
  assert.equal(text(run(quoted.input, { cwd: '/home/cj/notes with spaces' })), 'Quoted name.');
  assert.equal(completeCommand('cat .v', context()).input, 'cat .vault ');
  assert.equal(completeCommand('cd about', context()).suggestions.length, 0);
  assert.equal(completeCommand('cat /not-real/', context()).suggestions.length, 0);
  assert.equal(completeCommand('echo x | ca', context()).suggestions.length, 0);
});

test('completion replaces only the token at the cursor and does not mutate shell context', () => {
  const state = context({ cwd: '/home/cj/notes with spaces' });
  const snapshot = JSON.stringify(state);
  const completed = completeCommand('cat day trailing', state, 'cat day'.length);
  assert.deepEqual(parseCommand(completed.input), ['cat', 'day one.txt', 'trailing']);
  assert.equal(JSON.stringify(state), snapshot);
  const common = completeCommand('open proj', context());
  assert.equal(common.input, 'open project');
  assert.ok(common.suggestions.length > 1);
});

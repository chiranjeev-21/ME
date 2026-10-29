export class ShellParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShellParseError';
  }
}

export interface ShellToken {
  value: string;
  start: number;
  end: number;
}

/** Incomplete quotes are allowed only while computing interactive completions. */
export function tokenize(source: string, allowIncomplete = false): ShellToken[] {
  const tokens: ShellToken[] = [];
  let value = '';
  let start = -1;
  let quote: "'" | '"' | null = null;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quote === "'") {
      if (char === "'") quote = null;
      else value += char;
      continue;
    }
    if (char === '\\') {
      if (start === -1) start = i;
      if (i + 1 === source.length) {
        if (!allowIncomplete) {
          throw new ShellParseError(
            'Trailing escape. Add a character after \\ or quote a backslash.'
          );
        }
        value += '\\';
        continue;
      }
      const next = source[i + 1];
      if (quote === '"' && !['"', '\\', '$', '`', '\n'].includes(next)) {
        value += '\\';
      } else {
        i++;
        if (next !== '\n') value += next;
      }
      continue;
    }
    if (quote === '"') {
      if (char === '"') quote = null;
      else value += char;
      continue;
    }
    if (char === "'" || char === '"') {
      if (start === -1) start = i;
      quote = char;
    } else if ('|&;<>`()\n\r'.includes(char)) {
      throw new ShellParseError(
        `Unsupported shell operator ${JSON.stringify(char)}. Use one read-only command; quote literal symbols.`
      );
    } else if (/\s/.test(char)) {
      if (start !== -1) tokens.push({ value, start, end: i });
      value = '';
      start = -1;
    } else {
      if (start === -1) start = i;
      value += char;
    }
  }
  if (quote && !allowIncomplete) {
    throw new ShellParseError(
      `Unterminated ${quote === "'" ? 'single' : 'double'} quote. Close ${quote}.`
    );
  }
  if (start !== -1) tokens.push({ value, start, end: source.length });
  return tokens;
}

export function parseCommand(source: string): string[] {
  return tokenize(source).map(token => token.value);
}

export function quoteToken(value: string): string {
  return value && /^[a-zA-Z0-9_./~:@+-]+$/.test(value)
    ? value
    : `'${value.replace(/'/g, "'\\''")}'`;
}

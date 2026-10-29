import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import type { DesktopAppProps } from '../types';
import { completeCommand, executeCommand, welcomeLines } from './engine.ts';
import type { CompletionSuggestion, ShellAction, ShellEffect, ShellLine } from './engine.ts';
import styles from './TerminalApp.module.css';

interface OutputLine extends ShellLine {
  id: number;
  prompt?: boolean;
}

const MAX_SCROLLBACK = 360;
const MAX_HISTORY = 200;

function displayPath(path: string): string {
  return path === '/home/cj' || path.startsWith('/home/cj/')
    ? `~${path.slice('/home/cj'.length)}`
    : path;
}

export function TerminalApp(props: DesktopAppProps) {
  const { files, apps, projects, visible, openApp, openPath, closeWindow } = props;
  const { launchCount, payload } = props.window;
  const { hostname, version } = props.system;
  const [lines, setLines] = useState<OutputLine[]>(() =>
    welcomeLines().map((line, id) => ({ ...line, id }))
  );
  const [cwd, setCwd] = useState('/home/cj');
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<CompletionSuggestion[]>([]);
  const [completionNotice, setCompletionNotice] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cwdRef = useRef(cwd);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(0);
  const draftRef = useRef('');
  const nextIdRef = useRef(lines.length);
  const followOutputRef = useRef(true);
  const launchRef = useRef<number | null>(null);
  const inputId = useId();

  const focusInput = useCallback(() => {
    if (!visible) return;
    const active = document.activeElement;
    const outsideEditor =
      active instanceof HTMLElement &&
      !rootRef.current?.contains(active) &&
      (active.matches('input, textarea, select') || active.isContentEditable);
    if (!outsideEditor) inputRef.current?.focus({ preventScroll: true });
  }, [visible]);

  const applyEffect = useCallback(
    (effect: ShellEffect) => {
      if (effect.kind === 'app') openApp(effect.appId, effect.payload);
      else if (effect.kind === 'path') openPath(effect.path);
      else if (effect.kind === 'close') closeWindow();
    },
    [openApp, openPath, closeWindow]
  );

  const run = useCallback(
    (source: string, interactive = true) => {
      if (!source.trim()) return;
      const previousCwd = cwdRef.current;
      const history = [...historyRef.current, source].slice(-MAX_HISTORY);
      historyRef.current = history;
      historyIndexRef.current = history.length;
      const result = executeCommand(source, {
        cwd: previousCwd,
        files,
        apps,
        projects,
        history,
        system: { hostname, version },
      });
      cwdRef.current = result.cwd;
      setCwd(result.cwd);
      const additions: OutputLine[] = [
        {
          id: nextIdRef.current++,
          text: `cj@${hostname}:${displayPath(previousCwd)} $ ${source}`,
          prompt: true,
        },
        ...result.lines.map(line => ({
          ...line,
          text:
            line.text.length > 4000
              ? `${line.text.slice(0, 4000)} … [line truncated; open the file to read more]`
              : line.text,
          id: nextIdRef.current++,
        })),
      ];
      if (interactive) followOutputRef.current = true;
      if (result.effects.some(effect => effect.kind === 'clear')) setLines([]);
      else setLines(previous => [...previous, ...additions].slice(-MAX_SCROLLBACK));
      for (const effect of result.effects) applyEffect(effect);
      return result;
    },
    [files, apps, projects, hostname, version, applyEffect]
  );

  const submitCommand = (source: string) => {
    setInput('');
    setSuggestions([]);
    setCompletionNotice('');
    draftRef.current = '';
    const result = run(source);
    if (
      !result?.effects.some(
        effect => effect.kind === 'app' || effect.kind === 'path' || effect.kind === 'close'
      )
    ) {
      focusInput();
    }
  };

  // Payload commands are a per-launch request, not a reaction to changing app data.
  useEffect(() => {
    if (launchRef.current === launchCount) return;
    launchRef.current = launchCount;
    if (payload.command) run(payload.command, false);
  }, [launchCount, payload.command, run]);

  useEffect(() => {
    if (!visible) return;
    const frame = requestAnimationFrame(focusInput);
    return () => cancelAnimationFrame(frame);
  }, [visible, launchCount, focusInput]);

  useLayoutEffect(() => {
    if (!visible || !followOutputRef.current) return;
    const output = outputRef.current;
    if (output) output.scrollTop = output.scrollHeight;
  }, [lines, visible]);

  const chooseSuggestion = (suggestion: Pick<CompletionSuggestion, 'input' | 'cursor'>) => {
    setInput(suggestion.input);
    historyIndexRef.current = historyRef.current.length;
    setSuggestions([]);
    setCompletionNotice('');
    focusInput();
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(suggestion.cursor, suggestion.cursor);
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      if (!historyRef.current.length) return;
      event.preventDefault();
      const history = historyRef.current;
      if (historyIndexRef.current === history.length) draftRef.current = input;
      historyIndexRef.current =
        event.key === 'ArrowUp'
          ? Math.max(0, historyIndexRef.current - 1)
          : Math.min(history.length, historyIndexRef.current + 1);
      setInput(history[historyIndexRef.current] ?? draftRef.current);
      setSuggestions([]);
      setCompletionNotice('');
    } else if (event.key === 'Tab' && !event.shiftKey) {
      const completion = completeCommand(
        input,
        { cwd: cwdRef.current, files, apps, projects },
        event.currentTarget.selectionStart ?? input.length
      );
      if (!completion.suggestions.length) {
        setSuggestions([]);
        setCompletionNotice('No matching completions. Try help or ls.');
        return;
      }
      // A repeated Tab with no further expansion retains normal keyboard navigation.
      if (suggestions.length && completion.input === input) return;
      event.preventDefault();
      setInput(completion.input);
      setSuggestions(completion.suggestions);
      setCompletionNotice(
        `${completion.suggestions.length} completion${completion.suggestions.length === 1 ? '' : 's'}. Shift+Tab reaches suggestions; Tab again continues keyboard navigation.`
      );
      requestAnimationFrame(() => {
        inputRef.current?.setSelectionRange(completion.cursor, completion.cursor);
      });
    } else if (event.key === 'Escape') {
      setSuggestions([]);
      setCompletionNotice('');
    }
  };

  const activate = (action: ShellAction) => {
    if (action.kind === 'command') submitCommand(action.command);
    else applyEffect(action);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitCommand(input);
  };

  return (
    <div
      className={styles.terminal}
      ref={rootRef}
      onClick={event => {
        const target = event.target as HTMLElement;
        if (
          visible &&
          !target.closest('button, input, a, [role="log"]') &&
          !window.getSelection()?.toString()
        ) {
          inputRef.current?.focus({ preventScroll: true });
        }
      }}
    >
      <header className={styles.header}>
        <span>cj@{hostname} · virtual shell</span>
        <span className={styles.readOnly}>read-only</span>
      </header>
      <div
        ref={outputRef}
        className={styles.output}
        role="log"
        aria-label="Terminal output"
        aria-live={visible ? 'polite' : 'off'}
        aria-relevant="additions text"
        tabIndex={0}
        onScroll={event => {
          const output = event.currentTarget;
          followOutputRef.current =
            output.scrollHeight - output.scrollTop - output.clientHeight < 60;
        }}
      >
        {lines.map(line => (
          <div
            key={line.id}
            className={`${styles.line} ${line.prompt ? styles.promptLine : ''}`}
            data-tone={line.tone}
            data-intro={line.id === 1 && line.text === 'Chiranjeev Singh'}
          >
            {line.action ? (
              <button
                type="button"
                className={styles.outputAction}
                onClick={() => line.action && activate(line.action)}
              >
                {line.text || '\u00a0'}
              </button>
            ) : (
              <span>{line.text || '\u00a0'}</span>
            )}
          </div>
        ))}
      </div>
      <div className={styles.controls}>
        <div className={styles.starters} aria-label="Terminal shortcuts">
          <button type="button" onClick={() => submitCommand('open projects')}>
            Projects
          </button>
          <button type="button" onClick={() => submitCommand('resume')}>
            Resume
          </button>
          <button type="button" onClick={() => submitCommand('contact')}>
            Contact
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className={styles.suggestions} role="group" aria-label="Completion suggestions">
            {suggestions.slice(0, 12).map(suggestion => (
              <button
                type="button"
                key={suggestion.value}
                title={suggestion.description}
                onClick={() => chooseSuggestion(suggestion)}
              >
                <span>{suggestion.label}</span>
                {suggestion.description && <small>{suggestion.description}</small>}
              </button>
            ))}
            {suggestions.length > 12 && (
              <span>Keep typing to narrow {suggestions.length} matches.</span>
            )}
          </div>
        )}
        {completionNotice && (
          <p className={styles.completionNotice} role="status">
            {completionNotice}
          </p>
        )}
        <form className={styles.form} onSubmit={onSubmit}>
          <span className={styles.inputPrompt} aria-hidden="true">
            {displayPath(cwd)} $
          </span>
          <label className={styles.srOnly} htmlFor={inputId}>
            Terminal command
          </label>
          <input
            id={inputId}
            ref={inputRef}
            className={styles.input}
            value={input}
            onChange={event => {
              setInput(event.target.value);
              historyIndexRef.current = historyRef.current.length;
              setSuggestions([]);
              setCompletionNotice('');
            }}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={4096}
            enterKeyHint="send"
          />
          <button className={styles.run} type="submit">
            Run
          </button>
        </form>
      </div>
    </div>
  );
}

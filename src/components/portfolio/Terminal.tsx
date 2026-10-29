import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { EMAIL, EXPERIENCE, HERO_SKILLS, SOCIAL_LINKS } from '@/constants';
import { Icon } from './Icon';
import styles from './Portfolio.module.css';

interface TerminalProps {
  onClose: () => void;
  onNavigate: (section: string) => void;
  onVault: () => void;
}

export function Terminal({ onClose, onNavigate, onVault }: TerminalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lines, setLines] = useState([
    'CJ OS / a small terminal for a curious human.',
    'Type help to explore. This is a portfolio, not a system shell.',
  ]);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    inputRef.current?.focus();
    return () => dialog?.close();
  }, []);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [lines]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const command = input.trim().toLowerCase();
    if (!command) return;
    setHistory(previous => [...previous, input.trim()].slice(-40));
    setHistoryIndex(-1);
    setInput('');
    if (command === 'clear') {
      setLines([]);
      return;
    }
    if (command === 'exit') {
      onClose();
      return;
    }
    if (command === 'vault' || command === 'sidequests') {
      onVault();
      return;
    }
    const destinations: Record<string, string> = {
      work: 'work',
      projects: 'projects',
      systems: 'systems',
      about: 'about',
    };
    if (destinations[command]) {
      onNavigate(destinations[command]);
      return;
    }
    const responses: Record<string, string> = {
      help: 'whoami · experience · skills · work · systems · projects · about · contact · vault · clear · exit',
      whoami:
        'Chiranjeev Singh. Software Engineer at Microsoft / Azure Direct Drive. Previously Amazon and Oyo. Curious about distributed systems, applied AI, and what comes next.',
      experience: EXPERIENCE.map(item => `${item.company} / ${item.role} / ${item.period}`).join(
        '\n'
      ),
      skills: HERO_SKILLS.map(skill => skill.label).join(' / '),
      contact: [EMAIL, ...SOCIAL_LINKS.map(link => `${link.label}: ${link.href}`)].join('\n'),
      sudo: 'Nice try. Curiosity needs no elevated permissions.',
      ls: 'experience/  systems/  projects/  about/  hidden-vault/',
      pwd: '~/chiranjeev/portfolio',
    };
    const response =
      responses[command] || `Command not found: ${input.trim()}. Type help for the good stuff.`;
    setLines(previous => [...previous, `$ ${input.trim()}`, response].slice(-60));
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.terminalDialog}
      aria-labelledby="terminal-title"
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className={styles.terminalHeader}>
        <span id="terminal-title">
          <Icon name="terminal" size={17} /> cj@portfolio:~
        </span>
        <button onClick={onClose} aria-label="Close terminal">
          <Icon name="close" />
        </button>
      </div>
      <div
        ref={outputRef}
        className={styles.terminalOutput}
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
      >
        {lines.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
      <form onSubmit={submit} className={styles.terminalForm}>
        <label htmlFor="terminal-input">$</label>
        <input
          ref={inputRef}
          id="terminal-input"
          value={input}
          onChange={event => setInput(event.target.value)}
          aria-label="Terminal command"
          placeholder="Type help..."
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={200}
          onKeyDown={event => {
            if (!['ArrowUp', 'ArrowDown'].includes(event.key) || !history.length) return;
            event.preventDefault();
            const next =
              event.key === 'ArrowUp'
                ? Math.min(historyIndex + 1, history.length - 1)
                : Math.max(historyIndex - 1, -1);
            setHistoryIndex(next);
            setInput(next < 0 ? '' : history[history.length - 1 - next]);
          }}
        />
        <button type="submit" aria-label="Run command">
          <Icon name="arrow" size={18} />
        </button>
      </form>
      <div className={styles.terminalHint}>
        ESC to close <span>Try &quot;vault&quot; for a detour.</span>
      </div>
    </dialog>
  );
}

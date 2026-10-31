import { emphasisParts } from '../../data/content.ts';

/** Renders résumé copy, turning `<strong>` markers into emphasis without raw HTML. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {emphasisParts(text).map((part, index) =>
        part.strong ? (
          <strong key={index}>{part.text}</strong>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </>
  );
}

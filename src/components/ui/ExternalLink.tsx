import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { safeExternalUrl } from '../../data/content.ts';

interface ExternalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}

/** Opens in a new tab with an accessible cue; unsafe URLs render as plain text. */
export function ExternalLink({ href, children, ...rest }: ExternalLinkProps) {
  const url = href.startsWith('mailto:') ? href : safeExternalUrl(href);
  if (!url) return <span className={rest.className}>{children}</span>;
  const newTab = !url.startsWith('mailto:');
  return (
    <a
      href={url}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener noreferrer' : undefined}
      {...rest}
    >
      {children}
      {newTab && <span className="u-sr"> (opens in a new tab)</span>}
    </a>
  );
}

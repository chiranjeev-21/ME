import type { MouseEvent, ReactNode } from 'react';
import { routeHref } from '../navigation.ts';
import type { UniverseNavigation, WorldViewProps } from '../types';

type LinkProps = Pick<WorldViewProps, 'navigation' | 'navigate' | 'onWorldInteraction'> & {
  target: Partial<UniverseNavigation>;
  children: ReactNode;
  className?: string;
};

export function DestinationLink({
  navigation,
  navigate,
  target,
  children,
  className,
  onWorldInteraction,
}: LinkProps) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    if (target.projectSlug) {
      onWorldInteraction?.({ world: 'projects', kind: 'project', value: target.projectSlug });
    } else if (target.articleSlug) {
      onWorldInteraction?.({ world: 'writing', kind: 'article', value: target.articleSlug });
    }
    navigate(target);
  };
  return (
    <a className={className} href={routeHref({ ...navigation, ...target })} onClick={onClick}>
      {children}
    </a>
  );
}

export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="uw-sr"> (opens in a new tab)</span>
      <span aria-hidden="true"> ↗</span>
    </a>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="uw-eyebrow">{children}</p>;
}

export function MissingDocument({
  kind,
  ...props
}: Pick<WorldViewProps, 'navigation' | 'navigate'> & { kind: 'project' | 'article' }) {
  return (
    <div className="uw-missing">
      <Eyebrow>Destination unavailable</Eyebrow>
      <h1>This {kind} is not in the current collection.</h1>
      <p>
        The link may be out of date, or the public feed may have changed. The rest of the collection
        is still here.
      </p>
      <DestinationLink
        {...props}
        target={
          kind === 'project'
            ? { world: 'projects', projectSlug: null }
            : { world: 'writing', articleSlug: null }
        }
        className="uw-button"
      >
        Return to {kind === 'project' ? 'Projects' : 'Writing'} <span aria-hidden="true">→</span>
      </DestinationLink>
    </div>
  );
}

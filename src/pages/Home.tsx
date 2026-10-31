import { useRef } from 'react';
import { useChapterTransitions } from '../components/motion/useChapterTransitions.ts';
import type { GitHubFeedState } from '../hooks/useGitHubFeed.ts';
import type { PortfolioContent } from '../data/types.ts';
import { BeyondCode } from '../sections/BeyondCode/BeyondCode';
import { Contact } from '../sections/Contact/Contact';
import { Journey } from '../sections/Experience/Journey';
import { Hero } from '../sections/Hero/Hero';
import { Identity } from '../sections/Identity/Identity';
import { Lab } from '../sections/Lab/Lab';
import { Work } from '../sections/Projects/Work';

export function Home({ content, feed }: { content: PortfolioContent; feed: GitHubFeedState }) {
  const ref = useRef<HTMLElement>(null);
  useChapterTransitions(ref);
  return (
    <main id="main" ref={ref} tabIndex={-1}>
      <div id="backdrop" className="backdrop" aria-hidden="true" />
      <Hero />
      <Identity />
      <Journey />
      <Work projects={content.projects} />
      <Lab content={content} feed={feed} />
      <BeyondCode />
      <Contact />
    </main>
  );
}

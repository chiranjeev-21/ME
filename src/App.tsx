import { useState } from 'react';
import { Cursor } from '@/components/layout/Cursor/Cursor';
import { CloudTransition } from '@/components/layout/CloudTransition/CloudTransition';
import { Hero } from '@/components/sections/Hero/Hero';
import { Experience } from '@/components/sections/Experience/Experience';
import { SideQuests } from '@/components/sections/SideQuests/SideQuests';
import { CTA } from '@/components/sections/CTA/CTA';

/**
 * Root application — composes the portfolio views and page-level transitions.
 *
 * ── Adding a new section ────────────────────────────────────────────────────
 * 1. Create src/components/sections/YourSection/YourSection.tsx + .module.css
 * 2. Add content types to src/types/index.ts
 * 3. Add content data  to src/constants/index.ts
 * 4. Import and render <YourSection /> below in the desired order
 */
type View = 'main' | 'side-quests';

function App() {
  const [view, setView] = useState<View>('main');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetView, setTargetView] = useState<View | null>(null);

  const startTransition = (next: View) => {
    if (isTransitioning || view === next) return;
    setTargetView(next);
    setIsTransitioning(true);

    window.setTimeout(() => {
      setView(next);
      window.requestAnimationFrame(() => {
        window.scrollTo(0, 0);
      });
      setIsTransitioning(false);
      setTargetView(null);
    }, 2000);
  };

  const handleOpenSideQuests = () => startTransition('side-quests');
  const handleReturnToMain = () => startTransition('main');

  return (
    <>
      <Cursor />
      <main>
        {view === 'main' ? (
          <>
            <Hero onTreasureClick={handleOpenSideQuests} />
            <Experience />
            <CTA />
          </>
        ) : (
          <SideQuests onBack={handleReturnToMain} />
        )}
      </main>
      <CloudTransition visible={isTransitioning && targetView !== null} />
    </>
  );
}

export default App;

import { Cursor } from '@/components/layout/Cursor/Cursor';
import { Hero } from '@/components/sections/Hero/Hero';
import { Experience } from '@/components/sections/Experience/Experience';
import { CTA } from '@/components/sections/CTA/CTA';

/**
 * Root application — composes the full single-page portfolio.
 *
 * ── Adding a new section ────────────────────────────────────────────────────
 * 1. Create src/components/sections/YourSection/YourSection.tsx + .module.css
 * 2. Add content types to src/types/index.ts
 * 3. Add content data  to src/constants/index.ts
 * 4. Import and render <YourSection /> below in the desired order
 */
function App() {
  return (
    <>
      <Cursor />
      <main>
        <Hero />
        <Experience />
        <CTA />
      </main>
    </>
  );
}

export default App;

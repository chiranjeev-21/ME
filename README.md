# Chiranjeev Singh — Portfolio

**This branch: Personal Universe** — a scroll-driven expedition, not a hero animation.
A 240svh orbital scene (230svh on mobile) uses native scrolling to approach a
hand-drawn SVG/CSS planet: the camera enlarges it from 1× to 5×, shifts its position,
and reveals a layered surface. Scrolling back reverses the descent. A field journal
of Microsoft, Amazon, and Oyo work leads into connected skills, GitHub side quests,
the person behind the code, and contact. No canvas, model downloads, wheel trapping,
or timed sequence.

The visible **Skip to work** link and native section anchors bypass the journey.
Reduced-motion users get an unpinned, static illustrated introduction followed by
the same readable chapters. The portrait lives in About; the terminal and floating
treasure/vault remain conventional keyboard-accessible controls. The treasure
floats at the viewport edge in this concept rather than wandering across the copy.

A personal portfolio for **Chiranjeev Singh**, focused on software engineering, AI systems, and product-quality frontend presentation.

Built with **React 18**, **TypeScript 5**, and **Vite 5**.

The redesign is available as three independent design branches: **CJ OS**,
**Personal Universe**, and **Engineering Command Center**. All preserve the floating
treasure chest and GitHub-powered hidden vault. `main` remains the production branch.

See [deployment and preview instructions](docs/DEPLOYMENT.md) for branch previews,
optional exact GitHub pins, and choosing a production design.

## Getting Started

```bash
npm install
npm run dev
```

Local development starts on `http://localhost:5173`.
Parallel browser runs can use an isolated port in PowerShell:
`$env:PORTFOLIO_TEST_PORT='4272'; npm run test:e2e -- --workers=1`.
The test server uses that port strictly; the default remains 5173.

## Available Scripts

```bash
npm run dev         # start the local development server
npm run build       # create a production build
npm run preview     # preview the production build locally
npm run type-check  # run TypeScript checks
npm run lint        # run ESLint
npm run format      # format source files with Prettier
npm test            # GitHub API regression tests
npm run test:e2e    # desktop/mobile browser tests (install Chromium first)
```

## What The Project Contains

- Three creative directions with distinct interactive hero visuals.
- Resume-driven Microsoft, Amazon, and Oyo experience; distributed computing and AI skills.
- A reversible planet approach, contour-inspired chapters, reading progress, skill filters, and a chapter rail.
- A keyboard-accessible command terminal (`Ctrl+K` / `Cmd+K`) with history and real navigation.
- A floating treasure chest and hidden vault with live GitHub data and honest offline states.
- Responsive layouts, reduced-motion support, contact links, and email copying.

The browser suite includes measured planet bounding boxes and transforms before,
during, and after real wheel scrolling, reverse scrolling, chapter arrival,
reduced-motion readability, and narrow-screen overflow checks. `journey.spec.ts`
captures desktop/mobile launch, mid-zoom, landing, and work arrival. Set
`PORTFOLIO_ARTIFACT_DIR` to an existing absolute directory to save those captures
outside Playwright's per-test output folders. Live GitHub smoke remains opt-in
with `LIVE_GITHUB=1`; deterministic browser tests intercept the API.

## Tech Stack

- React
- TypeScript
- Vite
- CSS Modules
- ESLint
- Prettier

## Project Structure

```text
portfolio_final/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   ├── portfolio/
│   │   ├── sections/
│   │   └── ui/
│   ├── constants/
│   ├── hooks/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── api/
├── server/
├── tests/
├── index.html
├── package.json
└── vite.config.ts
```

## Code Quality

- Strict TypeScript configuration
- Modular component structure
- Reusable UI primitives
- CSS Modules for scoped styling
- Linting and formatting for consistent standards

## Production Build

```bash
npm run build
```

The production output is generated in `dist/`.

# Chiranjeev Singh — Portfolio

**This branch: CJ's Engineering Workbench** — an open, name-led portrait followed
by an engineering question that unfolds as you scroll. A sticky working sketch
adds a recovery path, then a failure-testing checkpoint, alongside the decisions
and resume-based evidence. Reverse scroll unwinds it. Chapter links work with
keyboard navigation and reduced motion; the full experience is also one click
from the hero, without taking the narrative route.

The diagram is explicitly a conceptual sketch, not a production topology or live
telemetry. Evidence links open the relevant Microsoft, Amazon, or Oyo details.
Agentic AI and Distributed Computing skills, GitHub-powered projects, engineering
notes, terminal, and treasure/vault remain available. No wheel/touch interception.
The treasure is a small, stationary corner entry here, so it never roams across
the working sketch. Returning from the vault restores the invoking control's focus.

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

Browser tests use one worker and port `5173` by default. For an isolated run in
PowerShell: `$env:PORTFOLIO_TEST_PORT='4273'; npm run test:e2e`. The test server
uses strict port binding. Live GitHub availability checks remain opt-in with
`LIVE_GITHUB=1`; routine tests use deterministic API fixtures.

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
- A reversible native-scroll question → system → evidence sketch, reading progress,
  skill filters, and a navigation dock that waits until after the opening story.
- A keyboard-accessible command terminal (`Ctrl+K` / `Cmd+K`) with history and real navigation.
- A floating treasure chest and hidden vault with live GitHub data and honest offline states.
- Responsive layouts, reduced-motion support, contact links, and email copying.

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

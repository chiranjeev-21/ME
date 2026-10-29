# Chiranjeev Singh — Portfolio

**This branch: Engineering Command Center / CJ's Workbench** — a name-led personal
portfolio with a taped portrait, a keyboard-accessible desk note, and a tactile
engineering focus map. Warm paper annotations meet cyan blueprints; the experience,
Agentic AI and systems skills, engineering principles, terminal, and hidden vault remain.

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
PowerShell: `$env:PORTFOLIO_TEST_PORT='4173'; npm run test:e2e`. The test server
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
- Scroll reveals, reading progress, sticky timeline context, skill filters, and a navigation dock.
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

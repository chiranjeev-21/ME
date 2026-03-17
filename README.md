# Chiranjeev Singh — Portfolio

Personal portfolio for **Chiranjeev Singh**, Software Engineer & AI Specialist.  
Built with **React 18 + TypeScript 5 + Vite 5** — production-grade architecture, contribution-ready structure.

---

## Quick Start

```bash
npm install
npm run dev          # → http://localhost:5173

npm run build        # type-check + production bundle → dist/
npm run preview      # preview production build locally
npm run type-check   # tsc --noEmit (zero build artefacts)
npm run lint         # eslint strict mode
npm run format       # prettier
```

---

## Project Structure

```
chiranjeev-portfolio/
├── index.html                          # Vite entry point + SEO meta + Google Fonts
├── vite.config.ts                      # Vite config — path alias @/ → src/
├── tsconfig.json                       # TypeScript strict mode + path aliases
├── tsconfig.node.json                  # tsconfig for vite.config.ts
├── .eslintrc.cjs                       # ESLint — TypeScript + React Hooks rules
├── .prettierrc                         # Prettier config
│
└── src/
    ├── main.tsx                        # React DOM entry — mounts <App /> to #root
    ├── App.tsx                         # Root composition — sections rendered here
    │
    ├── types/
    │   └── index.ts                    # ALL TypeScript interfaces (single source of truth)
    │
    ├── constants/
    │   └── index.ts                    # ALL site content — edit here to update the site
    │                                   # (experience, projects, skills, stats, nav, etc.)
    │
    ├── hooks/
    │   ├── useCursor.ts                # Custom cursor: dot snaps, ring lerps (rAF)
    │   ├── useScrollReveal.ts          # IntersectionObserver scroll-triggered reveals
    │   └── useParallax.ts             # Mouse-position parallax for hero blobs
    │
    ├── utils/
    │   └── cn.ts                       # Lightweight className combiner (no deps)
    │
    ├── styles/
    │   └── globals.css                 # Design tokens (CSS vars), reset, scroll-reveal utils
    │
    └── components/
        │
        ├── ui/                         # Reusable, stateless UI primitives
        │   ├── Button/
        │   │   ├── Button.tsx          # Variants: primary | ghost | cta | social
        │   │   └── Button.module.css
        │   ├── SectionLabel/
        │   │   ├── SectionLabel.tsx    # Small labelled section divider
        │   │   └── SectionLabel.module.css
        │   ├── SkillPill/
        │   │   ├── SkillPill.tsx       # Skill tag — normal / hot (purple accent)
        │   │   └── SkillPill.module.css
        │   └── index.ts                # Barrel export: import { Button, SkillPill } from '@/components/ui'
        │
        ├── layout/                     # App-level layout components
        │   ├── Navbar/
        │   │   ├── Navbar.tsx
        │   │   └── Navbar.module.css
        │   └── Cursor/
        │       ├── Cursor.tsx          # Dot + ring overlay, hidden on touch devices
        │       └── Cursor.module.css
        │
        └── sections/                   # Page sections — one folder each
            ├── Hero/
            │   ├── Hero.tsx            # Orchestrator — assembles blobs + navbar + columns
            │   ├── HeroBlobs.tsx       # Animated morphing background blobs (parallax)
            │   ├── HeroContent.tsx     # Left column: headline, description, CTAs, skills
            │   ├── HeroPortrait.tsx    # Right column: photo frame + floating badges
            │   └── Hero.module.css     # All hero styles + keyframes
            ├── Experience/
            │   ├── Experience.tsx      # Orchestrator — stats, cards, projects, edu
            │   ├── ExperienceCard.tsx  # Single job card
            │   ├── ProjectCard.tsx     # Single project card (featured spans full width)
            │   └── Experience.module.css
            └── CTA/
                ├── CTA.tsx             # Email + social links
                └── CTA.module.css
```

---


## Design Principles Applied

| Principle | Implementation |
|---|---|
| Separation of concerns | Data in `constants/`, types in `types/`, behaviour in `hooks/`, styles in `.module.css` |
| Single source of truth | All interfaces declared once in `src/types/index.ts` |
| Open/Closed | Add sections/variants without modifying existing files |
| Composable sections | Each section self-contained with co-located styles |
| Performance | GPU-only animations, passive event listeners, fire-once IntersectionObserver |
| Accessibility | `aria-hidden` on decorative elements, `:focus-visible` ring, semantic HTML |

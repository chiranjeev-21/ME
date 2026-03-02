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

## Customisation Guide

### Update content (zero component changes needed)
Everything lives in **`src/constants/index.ts`**:

| Export | Controls |
|---|---|
| `EXPERIENCE` | Job history cards |
| `PROJECTS` | Featured project cards |
| `HERO_SKILLS` | Skill pills in hero |
| `HERO_BADGES` | Floating badges around portrait |
| `STATS` | Numeric stats in experience section |
| `EDUCATION` | Education & certification cards |
| `NAV_LINKS` | Navigation items (add `cta: true` for pill style) |
| `SOCIAL_LINKS` | Social links in CTA section |
| `EMAIL` | Contact email address |

### Add your photo
1. Drop your image at `public/images/photo.jpg`
2. Open `src/components/sections/Hero/HeroPortrait.tsx`
3. Delete the `<PlaceholderPortrait />` component
4. Uncomment the `<img>` tag (instructions are in the file)

### Add a new section
1. Create `src/components/sections/YourSection/YourSection.tsx` + `.module.css`
2. Add data types to `src/types/index.ts`
3. Add data to `src/constants/index.ts`
4. Import and render `<YourSection />` in `src/App.tsx`

### Change design tokens
Edit CSS custom properties in `src/styles/globals.css` — colours, spacing, fonts, radii all cascade automatically.

---

## Tech Stack

| | |
|---|---|
| **React 18** | UI rendering with Concurrent Mode |
| **TypeScript 5** | Strict mode, path aliases (`@/`) |
| **Vite 5** | Sub-second HMR, optimised production bundles |
| **CSS Modules** | Scoped styles — zero class name collisions |
| **Native CSS** | Design tokens via CSS custom properties |
| **IntersectionObserver** | Scroll-triggered reveal animations |
| **requestAnimationFrame** | Smooth cursor lerp |

No CSS-in-JS. No heavy animation libraries. All motion via CSS keyframes + rAF — GPU-composited `opacity` and `transform` only.

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

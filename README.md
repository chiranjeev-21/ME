# Chiranjeev Singh — Personal Universe

**From orbit to the details.** A cinematic, scroll-driven portfolio in six
chapters: it opens above the night side of Earth, looking across southern India
toward an orbital sunrise, descends into who I am and what I have built, and
closes on an eclipse over the same coastline.

React 18 · TypeScript · Vite · GSAP (ScrollTrigger, SplitText) · Motion · raw
WebGL 2 · CSS Modules. Deployed on Vercel with one serverless function for the
live GitHub feed.

## The six chapters

| #   | Chapter            | Experience                                                                                                                                                       |
| --- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01  | Opening            | Pinned orbital dawn rendered in WebGL; the name surfaces letter by letter, disperses on scroll, and sunrise floods into the next chapter                         |
| 02  | Identity           | Paper-toned editorial chapter: masked line reveals, a portrait opened by a moving mask, reading-pace text, counter-drifting facet lines                          |
| 03  | Journey            | Pinned horizontal timeline driven by vertical scroll; each role has its own light, parallax year numerals and a progress rail                                    |
| 04  | Engineering & Work | “Things I’ve built.” Pinned scenes (frame → full-bleed hold → slate and details) for CJ OS, the research artifact and every live GitHub side quest; studio notes |
| 05  | Beyond Code        | A physically modelled guitar neck (sound off by default), the Playbox for building and recording strums, and a torch-lit Hush wordmark                           |
| 06  | Contact            | Eclipse over India; magnetic email action with copy feedback, GitHub, LinkedIn and the résumé                                                                    |

All career facts come from `src/data/facts.ts`, which mirrors the résumé PDF in
`public/resume`. Project case studies, the research artifact and notes are
carried over from the previous builds; nothing is invented.

## Motion system

| Primitive               | Role                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `SplitReveal`           | Masked line/word/char reveals (GSAP SplitText, re-splits on resize, accessible labels) |
| `Reveal`                | One-time block entrances: rise, fade, or clip wipe; optional child stagger             |
| `ScrubText`             | Words brighten at reading pace as the passage crosses the viewport                     |
| `ImageReveal`           | Clip-path mask with a settling camera push and scroll drift                            |
| `Parallax`              | Depth/drift layers scrubbed to scroll                                                  |
| `PinnedSection`         | CSS-sticky stage with a scrubbed timeline (no pin-spacer reflow)                       |
| `HorizontalScroll`      | Pinned horizontal track with `containerAnimation` hooks and keyboard focus handling    |
| `useChapterTransitions` | Scrubs `--bg`, `--fg`, `--accent` between chapters; publishes the active chapter       |
| `Magnetic`              | Spring-based magnetic pull (Motion) for primary actions, fine pointers only            |

GSAP owns scroll choreography; Motion owns component-level UI (chapter index,
case-study overlays, magnetic action). They never animate the same properties.
Easing tokens (`reveal`, `cine`, `settle`) are shared between CSS and GSAP.

Every primitive runs inside `gsap.matchMedia()` and is reverted on unmount via
`useGSAP`. With `prefers-reduced-motion: reduce` there are no pins, scrubs or
live WebGL: chapters are ordinary documents and the scenes show static posters.

## The orbital scene

`src/scenes/orbital` is a single full-screen WebGL 2 pass (no Three.js):
analytic ray/sphere Earth with NASA Blue Marble, Black Marble city lights (plus
a 2K South Asia crop) and clouds; single-scattering Rayleigh + Mie atmosphere
with planet shadowing and airglow; star field with colour temperature; sun disk,
glare and a restrained anamorphic streak; ACES tone mapping and grain.

- Lazy: the renderer module loads only as a scene nears the viewport, and the
  hero waits until its entrance has played. Posters (`public/images/orbit`) are
  shown first and remain if WebGL 2 is unavailable.
- Non-blocking: `KHR_parallel_shader_compile`, uniform lookups after linking,
  `createImageBitmap` decoding, and one texture upload per frame.
- Adaptive: quality tier by device, DPR caps, and automatic resolution scaling
  when frames run slow. Rendering stops off-screen, in hidden tabs and under
  overlays. Camera state is read from refs, so scrolling causes no React renders.

`npm run dev`, then open `/?scene=dawn&p=0.5` or `/?scene=eclipse&p=1` for the
development-only scene harness (used to render the posters).

## Side quests

Side quests come live from GitHub, and each gets the same pinned scene as the case
studies. The visual is always real: a screenshot of the repository's live site
(`public/images/quests`, used only while the repo still links to that site), a
verbatim source excerpt with its file and line range, a live illustration of the
architecture its README documents (the Decentralised Package Manager's
peer-to-peer swarm: chunks streamed in parallel between CI machines, then
SHA-256 verified — `src/scenes/swarm`), or the repository name set as a type
specimen. The package manager leads; the server keeps it in the keyless feed
(`GITHUB_FEATURED_REPOSITORIES` overrides the default). Details are public metadata only (`src/data/questMedia.ts`
maps repositories to visuals). With no feed, the section says so instead.

## Playbox

`/playbox`, opened from the guitar in chapter 05, is an instrument space:

- Pick one fret per string (or mute it) to build a chord; common chords are named,
  presets cover the open shapes, and strums go down or up.
- String chords into a looping sequence with step lengths in beats at a set tempo;
  playback is scheduled ahead on the Web Audio clock. The song is saved locally.
- **Rec** captures everything played. The take is re-rendered note for note in an
  `OfflineAudioContext` and downloads as a 16-bit WAV — no microphone involved.

All sound is Karplus–Strong synthesis in the browser (`src/scenes/strings`).

## Routes

```text
/                                   the six chapters
/#journey, /#side-quests, /#notes …  chapter and section anchors
/projects/cj-os-desktop             case study overlay (also face-mask-detection)
/projects/repo-<name>               live GitHub repository dossier
/writing/retrieval-is-not-evidence  studio note overlay
/playbox                            guitar playbox overlay
```

Overlays sit above the still-mounted home page, so closing returns to the exact
scroll position and browser Back/Forward work as expected. Links from the
previous CJ Universe build (`/world/hush?mode=explore`, `?vault=1`, …) are
rewritten to their new chapter anchors.

## Architecture

```text
src\
  app\          router (real anchors, history), route parsing, active-chapter store
  components\
    motion\     reusable GSAP / Motion primitives listed above
    navigation\ header with chapter marker and reading hairline, chapter index dialog
    ui\         icons, external links, résumé rich text, chapter marks
  sections\     Hero, Identity, Experience (Journey), Projects (Work, side quests, notes), BeyondCode, Contact
  pages\        Home, case-study / note / not-found overlays, Playbox
  scenes\
    orbital\    camera math, GLSL, WebGL 2 renderer, React scene component
    strings\    string physics, Karplus–Strong synthesis, shared audio engine, WAV encoder
  data\         facts (résumé), content adapter, quest media, chapters, themes, types
  hooks\        GitHub feed, reduced motion
  lib\          GSAP registration and eases, idle motion queue, Motion feature loader
  styles\       tokens and global styles
server\, api\   GitHub feed (pinned with a token, recent without one)
```

## Run and verify

Node.js 24+ is recommended; unit tests use native TypeScript stripping.

```powershell
npm ci
npm run dev
npm run build
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

`npm test` covers content provenance, quest media lookups, routes (including
legacy links), camera framing and sunrise behaviour, string physics, chord
recognition, strum timing, song validation and the WAV encoder.
`npm run test:e2e` drives Chromium on desktop and mobile: every chapter and
contact link, the chapter index dialog, case-study overlays and history, legacy
links, notes and 404, side quest scenes (live feed and fallback), instruments,
the Playbox (chords, sequence, playback, recording to WAV, persistence),
clipboard feedback, pinned motion and chapter light, the live WebGL scene, the
no-WebGL fallback, and narrow layouts. Set `PORTFOLIO_PREVIEW=1` to test the production build.

The live GitHub check is opt-in:

```powershell
$env:LIVE_GITHUB = '1'
npm run test:e2e -- --project=desktop --grep 'actual live GitHub'
Remove-Item Env:\LIVE_GITHUB
```

## Honest limits

- The Hush section is an atmosphere study; it contains no gameplay footage.
  Real stills can be added later as project imagery.
- Earth's atmosphere is thickened (~5×) so it reads at portfolio scale.
- Side quests show public repository metadata (description, language, topics),
  never inferred case studies; with no live feed they say so instead of
  showing stale entries.
- GitHub pins need an optional server-side token (see `.env.example`); without
  one the feed shows recent public repositories and labels them as such.

Asset credits: [`public/assets/CREDITS.txt`](public/assets/CREDITS.txt).
Deployment: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

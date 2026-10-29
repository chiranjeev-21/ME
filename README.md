# CJ Universe

**Engineering ideas. Building experiences. Exploring what's next.**

Chiranjeev Singh's explorable personal solar system: a real Three.js scene,
seven distinct destinations, and an equally capable text-first portfolio.

The existing React 18 / TypeScript / Vite application and Vercel API integration
are retained. The renderer uses **React Three Fiber 8, Drei 9, and Three.js**;
there is no framework migration or database requirement.

## Explore or browse

**Explore Mode** renders an animated central sun, procedural planets, atmospheres,
rings, moons, landmarks, thin orbital guides, stars, and restrained environmental
effects. Select a body or use the planet selector for a guided camera approach.
The Projects planet has selectable beacons that open the same case studies as
the catalog.

**Browse Mode** uses the same content, destination components, project selections,
filters, and routes, without creating a WebGL renderer. Switching modes does not
replace a project or article with a different version of its content.

| World       | Experience                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| About       | Editorial portrait, verified career history, credentials, skills, original résumé PDF                               |
| Engineering | Blueprint-inspired decisions, recovery sketches, and qualified résumé evidence                                      |
| AI Lab      | Working local lexical retrieval with source text, computed cosine scores, measured timings, and explicit abstention |
| Projects    | Searchable/filterable case studies, real runtime screenshots, source links, GitHub metadata, builder vault          |
| Creative    | Original seeded contour-garden studio, palette/density controls, SVG export, honest media availability              |
| Writing     | Paper reading room, searchable archive, three substantive implementation notes, direct article links                |
| Contact     | Verified direct email/social destinations and clipboard feedback                                                    |

Original Hush gameplay/screenshots/build links and music/guitar recordings were
not supplied in this portfolio repository. The Creative world says so explicitly:
there are no fake recordings, simulated game previews, or autoplay audio.

## Controls

- **Explore Universe** opens the full-system composition.
- Select a planet by pointer/touch, a planet-selector button, or the command palette.
- Use left/right arrows and Home/End within the planet selector; Enter selects.
- **Full universe / All worlds** returns to the overview.
- Escape backs out of a project/article, then a world. It does not intercept typing.
- `Ctrl+K` / `Cmd+K` opens the searchable command palette.
- Backtick or **Launch Terminal** opens the read-only portfolio shell.
- Terminal supports history, quoted arguments, completion, and clickable destinations.
- The quality selector provides Auto, Low, and High settings.

## Direct routes

```text
/?mode=explore
/?mode=browse
/world/engineering?mode=browse
/world/ai-lab?mode=browse
/projects/cj-os-desktop?mode=browse
/writing/one-universe-two-ways-in?mode=browse
/world/projects?mode=browse&vault=1
```

An optional `quality=low` query chooses the lightweight renderer on first load.
Real anchors support new tabs and browser navigation. Vercel rewrites only the
three destination route prefixes; `/api/*` and static assets remain untouched.

## Run and verify

Node.js 24+ is recommended; the core tests use native TypeScript stripping.

```powershell
npm ci
npm run dev
npm run build
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

Use `PORTFOLIO_TEST_PORT` to choose another browser-test port. Browser automation
uses Chromium software WebGL so the real scene can be verified without requiring
a particular host GPU. It checks mesh raycasting, guided cameras, planet and project
selection, both modes, direct routes, local research, creative export, reduced
motion, narrow layouts, unavailable WebGL, and actual context loss.

The separate real-network smoke check is opt-in:

```powershell
$env:LIVE_GITHUB = '1'
npm run test:e2e -- --project=desktop --grep 'actual live GitHub'
Remove-Item Env:\LIVE_GITHUB
```

`npm run dev` includes the local GitHub API middleware. `npm run preview` is a
static preview; use Vercel or the development middleware for the serverless feed.

## Architecture

```text
src\universe\
  Universe.tsx          Application shell, modes, HUD, renderer recovery
  navigation.ts        Typed URL parsing and shared destination state
  useNavigation.ts     Browser history and local presentation preference
  worlds.ts            Seven typed world definitions
  content.ts           Verified profile, project adapter, authored studio notes
  scene\               Camera rig, models, shaders, procedural textures, environment
  worlds\              Distinct destination interfaces and readable detail views
  lab\                 Bounded TF-IDF retrieval and inspectable research interface
  ui\                  Shared icons, command palette, read-only terminal
```

The scene emits navigation requests. It does not own a parallel content router.
Projects, articles, planet selection, terminal commands, and both presentation
modes converge on the same destination model.

## Performance, accessibility, and honest limits

- The Three.js renderer is lazy-loaded; important text and navigation arrive first.
- Geometry detail, particles, and DPR are device-aware. Low quality uses DPR 1;
  High is capped at 1.5. Repeated environmental details are instanced.
- Camera choreography is wall-clock bounded, not tied to a minimum frame rate.
- Rendering pauses when the document is hidden. No heavy real-time shadows or
  full-screen postprocessing stack are required.
- Sun glow/corona, surface textures, atmospheres, stars, and structures are original
  procedural assets. No external model or texture download is required.
- Reduced motion defaults to Browse; explicit Explore remains usable with static
  environments and immediate camera changes.
- WebGL 2 failure or context loss preserves the current destination in Browse.
- Portrait and real project screenshots are appropriately sized WebP assets.
- The local research lab is **not a remote LLM, embedding model, or autonomous
  agent**. It quotes actual evidence, computes actual scores, and measures local
  execution rather than inventing benchmarks.
- GitHub pins require an optional server-side token. Without one, recent public
  repositories are labeled as recent; upstream failure is an honest local fallback.
- Dynamic repository descriptions do not become invented architecture, impact,
  launch, or service-health claims.

## Deployment

The 3D release uses `feature/cj-universe-3d` and `design/personal-universe`.
Vercel generates Preview deployments from pushes. The approved CJ OS branches,
Engineering Workbench, `main`, and production are not changed by this release.

See [deployment instructions](docs/DEPLOYMENT.md) for branch previews, optional
GitHub pins, environment variables, and production promotion.

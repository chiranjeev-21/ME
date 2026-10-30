# CJ Universe

**Engineering ideas. Building experiences. Exploring what's next.**

Chiranjeev Singh's explorable constellation: eight content-shaped worlds in a real
Three.js scene, with an equally capable text-first portfolio. Earth is the human
home world; the other bodies are deliberately sculpted metaphors, not arbitrary
astronomical planets with different colors.

The existing React 18 / TypeScript / Vite application and Vercel API integration
are retained. The renderer uses **React Three Fiber 8, Drei 9, and Three.js**;
there is no framework migration or database requirement.

## Explore or browse

**Explore Mode** renders an animated central sun, procedural planets, atmospheres,
rings, moons, landmarks, thin orbital guides, stars, and restrained environmental
effects. **Native scrolling drives the journey:** approach a planet, cross its
atmosphere, then read inside its themed 3D environment. Scroll backwards to
reverse the flight. Real chapter geometry, including changing document heights,
controls the camera rather than an artificial timer or wheel trap.
Planet controls, mesh selection, and direct links skip straight to a destination.
Project beacons open the same case studies as the catalog.

The inhabited-world graphics layer adds a 2K NASA Earth map and rotating clouds,
real skinned walking people, animated robot guides, original articulated aliens,
modeled trees, and CC0 photogrammetry materials. High quality adds a local 1K HDRI.
**Hush** is a separate ghost-inspired world with a moonlit haunted
arcade, floating ghosts, and an interactive lantern. This is original portfolio
scenery, explicitly **not Hush gameplay footage**.

**Browse Mode** uses the same content, destination components, project selections,
filters, and routes, without creating a WebGL renderer. Switching modes does not
replace a project or article with a different version of its content.

| World       | Experience                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| About       | Editorial portrait, verified career history, credentials, skills, original résumé PDF                               |
| Engineering | Working request-reasoning diagram and design principles, rather than a second résumé                                |
| AI Lab      | Working local lexical retrieval with source text, computed cosine scores, measured timings, and explicit abstention |
| Projects    | Searchable/filterable case studies, real runtime screenshots, source links, GitHub metadata, builder vault          |
| Creative    | Original seeded contour-garden studio, palette/density controls, SVG export, and creative process                   |
| Hush        | Dedicated ghost world and original haunted arcade, with a working lantern and one clear footage disclaimer          |
| Writing     | Paper reading room, searchable archive, three substantive implementation notes, direct article links                |
| Contact     | Verified direct email/social destinations and clipboard feedback                                                    |

Information has a primary home: career details live in About, projects in the
catalog, long-form notes in Writing, and professional links in Contact. The shell
offers one destination map rather than repeating header menus, hero promotions,
and project shelves. Public repository entries are concise metadata dossiers,
not repeated placeholder case studies.

Original Hush gameplay/screenshots/build links and music/guitar recordings were
not supplied in this portfolio repository. Hush has one compact footage disclaimer;
the illustrated haunted set does not substitute for actual footage or game claims.

## Controls

- **Begin the journey** scrolls into the first planetary approach.
- Keep scrolling to enter, explore the content, and travel to the next world.
- Reverse scrolling retraces the approach and returns to the solar system.
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
/world/hush?mode=explore
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
a particular host GPU. It checks native-scroll zoom and reversal, mesh raycasting, planet and project
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
  journey\             Measured native-scroll chapters and reversible expedition state
  worlds.ts            Eight typed content-shaped world definitions
  content.ts           Verified profile, project adapter, authored studio notes
  scene\               Camera rig, models, shaders, procedural textures, environment
    assets\            Local model loading, skinned animation, population routes
  worlds\              Distinct destination interfaces and readable detail views
  lab\                 Bounded TF-IDF retrieval and inspectable research interface
  ui\                  Shared icons, command palette, read-only terminal
```

The scene emits navigation requests. It does not own a parallel content router.
Projects, articles, planet selection, terminal commands, and both presentation
modes converge on the same destination model.
Scrolling replaces the current world URL without adding a history entry for every
chapter. Explicit navigation and browser history use measured destination anchors.
Both modes retain the same mounted documents, including local drafts and filters.

## Performance, accessibility, and honest limits

- The Three.js renderer is lazy-loaded; important text and navigation arrive first.
- Geometry detail, particles, and DPR are device-aware. Low quality uses DPR 1;
  High is capped at 1.5. Repeated environmental details are instanced.
- Camera choreography reads scroll progress from refs, without per-frame React
  state updates. Only world and phase boundaries update application state.
- Only the current planetary interior is mounted. Document motion pauses off-world;
  section reveals and interactive diagrams respect reduced motion.
- Rendering pauses when the document is hidden. No heavy real-time shadows or
  full-screen postprocessing stack are required.
- Sun glow/corona, surface textures, atmospheres, stars, and structures are original
  procedural assets, complemented by locally hosted licensed models and textures.
  The complete additional graphics asset set is below 5 MB; only active interiors
  request their inhabitants. Low quality uses fewer citizens and omits the HDRI.
- Asset credits, source URLs, licenses, and modifications are linked from the HUD
  at `/assets/CREDITS.txt`. No runtime asset CDN, decoder CDN, or asset API is needed.
- `npm run assets:worlds` regenerates the original alien, ghost, and tree GLBs from
  `scripts\build-world-models.mjs`. It does not replace third-party licensed models.
- Local asset boundaries preserve the base scenery and navigation if a model or
  texture fails. Late-loading surfaces join the current scroll fade.
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

The distinct-worlds release uses `feature/cj-universe-distinct-worlds`, with
`feature/cj-universe-3d` and `design/personal-universe` tracking the verified release.
Vercel generates Preview deployments from pushes. The approved CJ OS branches,
Engineering Workbench, `main`, and production are not changed by this release.

See [deployment instructions](docs/DEPLOYMENT.md) for branch previews, optional
GitHub pins, environment variables, and production promotion.

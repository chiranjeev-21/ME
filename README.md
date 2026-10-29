# CJ OS

Chiranjeev Singh's personal computer on the web. A complete desktop experience,
not a scrolling portfolio wearing a terminal costume.

The desktop starts clean: **no pre-opened apps**. Original desktop icons, a centered
glass dock, native-style menus, and restrained window chrome provide a macOS-inspired
interface without bundling Apple's wallpapers, icons, or fonts.
The treasure is now a tidy **Side quests** desktop icon opening the same vault,
instead of a floating overlay competing with application controls.

Built with the existing **React 18, TypeScript, Vite, and CSS Modules** stack. No
database, paid API, animation framework, or server shell is needed.

## Five applications

| App              | What it does                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Terminal         | A parsed command language, read-only virtual filesystem, history, completion, and shared app launching  |
| Project Explorer | Browse projects, experiments, engineering notes, assets, and hidden files                               |
| AI Lab           | Run and inspect a real local lexical retrieval experiment with extractive evidence and measured timings |
| System Monitor   | Inspect actual GitHub data, browser workspace state, and recorded lab runs                              |
| Resume           | Conventional experience, skills, contact links, and the original downloadable résumé PDF                |

Documents, project investigations, desktop settings, and the hidden treasure vault
open as additional windows. There is deliberately no music player or autoplay audio.

## Desktop controls

- Drag a titlebar or use its focused move control with arrow keys.
- Double-click a desktop icon, or select it and press Enter. On phones, tap once.
- Resize with the lower-right handle, or focus it and use arrow keys.
- Minimize, maximize/restore, and close with the window controls.
- Click a dock icon to open, focus, or restore an app. The yellow window control
  minimizes it; clicking an already-active dock icon does not hide it.
- `Ctrl+K` / `Cmd+K` searches applications, projects, notes, and shell commands.
- Backtick opens Terminal when you are not typing in another field.
- On mobile, apps become full-screen views with a persistent dock.
- Wallpaper, accent, and font-size preferences are stored locally. Reduced motion
  follows the device setting.

The dock, explorer, palette, and terminal all use the **same application registry
and window manager**. Opening the same project from different places restores the
same project window. App state survives minimization.

## Try the shell

```text
help
whoami
ls -a
cd ~/projects
open cj-os
cat ~/projects/ai-lab/README.md
cat "~/writing/design notes.md"
sudo hire cj
```

Paths are virtual. The terminal cannot execute operating-system commands, read the
host filesystem, modify files, or run pipelines. Errors and unsupported syntax
are explained instead of being sent to a server shell.

## Run and verify

Use Node.js 24+ (the focused core tests use native TypeScript stripping).

```powershell
npm install
npm run dev
npm run build
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

The API uses the same server handler in Vite development and Vercel Functions.
`PORTFOLIO_TEST_PORT` can select an isolated browser-test port.

Core tests exercise shell parsing, virtual paths, app identity, window geometry,
preferences, portfolio content, and retrieval behavior. Browser tests cover the
real desktop, responsive app views, keyboard controls, drag/resize, shared launching,
the original PDF download, and the hidden vault.

## Honest data, explicit limits

GitHub pins require an optional server-side `GITHUB_TOKEN`. Without it, live recent
public repositories are explicitly labeled as recent; upstream failure shows a
local artifact. Credentials never belong in `VITE_*` variables.

The AI Lab demonstrates lexical retrieval and extractive evidence, **not a remote
LLM or semantic embedding model**. Scores and timings are calculated in the
visitor's browser. The monitor labels unavailable deployment/server telemetry as
unavailable; it does not invent service health or production benchmarks.

The virtual case study for CJ OS documents this actual implementation. Other
repositories show verified metadata and links, not fabricated architecture or
impact claims.

## Deployment

The OS release branches are `feature/cj-os-desktop` and `design/cj-os`, kept on the
same desktop implementation. Vercel creates an independent
Preview deployment when it is pushed. `main` and the production domain are left
unchanged until the selected design is merged.

See [deployment instructions](docs/DEPLOYMENT.md) for previews, optional exact pins,
environment variables, and production promotion. The earlier visual concepts
remain on their own `design/*` branches.

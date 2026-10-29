# Design branches and Vercel previews

The production branch remains `main`. Nothing needs to be disconnected or reimported.

## Current desktop release

`feature/cj-os-desktop` is the complete OS experience: a shared window manager,
read-only parsed shell, Project Explorer, local retrieval lab, real-data monitor,
and conventional résumé/PDF app. The dock, palette, terminal, and virtual files
launch the same application instances.

The desktop lives in `src/os/Desktop.tsx`; app metadata lives in
`src/os/registry.ts`. This branch does not use the older `ACTIVE_CONCEPT` switch.
Direct app links include `/#app=resume`, `/#app=lab`, and
`/#app=explorer&path=%2Fhome%2Fcj%2Fprojects`.

Push this branch to the existing repository to create a Vercel Preview. No extra
project, API key, or database is required. The optional GitHub-pin configuration
below still applies. Promote only after reviewing the desktop preview.

## Earlier visual explorations

| Branch                              | Concept                    | Distinctive interaction                                           |
| ----------------------------------- | -------------------------- | ----------------------------------------------------------------- |
| `design/cj-os`                      | CJ OS + Hacker Terminal    | Profile window tabs, command terminal, graphite/lime desktop      |
| `design/personal-universe`          | Personal Universe          | Orbital navigation, dimensional planet, lavender/peach atmosphere |
| `design/engineering-command-center` | Engineering Command Center | Interactive storage/signals/AI focus map, blueprint styling       |

All three share the resume update, scroll interactions, responsive navigation,
accessible terminal, floating treasure, and live GitHub vault. The selected concept
is defined in `src/constants/concept.ts`. The focus map is illustrative, not a diagram
of an employer's production architecture.

## View all three without changing production

1. Sign in at [Vercel](https://vercel.com/dashboard).
2. Open the existing portfolio project connected to `chiranjeev-21/ME`.
3. Open **Settings > Git** and confirm the connected repository is still correct.
4. Open **Settings > Environments > Production** and confirm branch tracking is `main`.
   Some dashboard versions show this as **Production Branch** under Git settings.
5. Open **Deployments**. Filter by each design branch. By default, every push to a
   non-production branch creates a **Preview** deployment automatically.
6. Open a deployment, wait for **Ready**, then click **Visit**. Use **Copy URL** to
   share it. The deployment details show both the branch and commit.
7. Prefer the branch-specific URL when comparing designs: it follows future commits
   on that branch. A commit-specific URL is an immutable snapshot.

You do **not** need three Vercel projects. Keeping `main` as the production branch
leaves `https://chiranjeev.vercel.app` on the existing design.

If a branch has no deployment:

1. Check that the branch was pushed to GitHub.
2. In Vercel, verify the GitHub App still has access to this repository.
3. Check project Git settings for disabled automatic deployments, branch restrictions,
   or an **Ignored Build Step** that skips non-main branches.
4. Check the commit's Vercel status on GitHub. Authentication/commit-author errors
   must be resolved using the owner's Vercel/GitHub account.
5. In **Deployments**, use **Create Deployment**, choose the branch, and deploy.
   The precise action label can vary with dashboard updates.
6. The build settings are **Vite**, `npm run build`, and output directory `dist`.
   `vercel.json` also configures the GitHub API function. Do not configure a global
   rewrite that sends `/api/*` to `index.html`.

Preview URLs may require Vercel authentication. If sharing externally, inspect
**Settings > Deployment Protection** and choose the sharing/protection behavior
appropriate for the project. A sign-in page is not evidence that the site failed to build.

## How the GitHub integration works

`GET /api/github-pinned` runs on the server, both in local Vite development and
as a Vercel Function in production.

| Configuration/result                                 | What visitors see                                    |
| ---------------------------------------------------- | ---------------------------------------------------- |
| Valid optional `GITHUB_TOKEN` and public pins        | Exact **pinned repositories** from GitHub GraphQL    |
| No token, expired token, or no usable public pins    | Live **recent public repositories** from GitHub REST |
| GitHub outage, rate limit, or no public repositories | Clearly labeled **local artifact**                   |

Recent repositories are never labeled as pins. Private repositories and forks are
excluded from the recent list. The response includes project links, demo links,
language, topics, stars, forks, and update times. Upstream requests are bounded;
successful responses are edge-cached for 15 minutes. Offline fallbacks use a short
one-minute cache so a transient failure does not linger.

The browser validates the payload and has a 15-second timeout. Loading content is
not presented as a successfully synced artifact.

### Optional: enable exact profile pins

No paid service or API key is required for the live recent-repository feed.
For exact pins, create a minimally privileged GitHub token:

1. Sign in to GitHub as the account that owns the public pins.
2. Click your avatar, then **Settings**.
3. In the sidebar, open **Developer settings**.
4. Open **Personal access tokens > Fine-grained tokens**.
5. Click **Generate new token** and complete any authentication prompt.
6. Name it `portfolio-public-pins`, choose a sensible expiration, and select your
   personal account as **Resource owner**.
7. Under **Repository access**, choose **Public repositories**. Do not grant access
   to private repositories, organization repositories, or write permissions.
8. Leave additional permissions unset; public repository information is read-only.
   Click **Generate token** and copy the token once.
9. In Vercel, open the portfolio project, then **Settings > Environment Variables**.
10. Add `GITHUB_TOKEN` as a **Secret**, selecting **Preview** and **Production**.
    If branch restrictions are offered, apply it to all three design branches.
11. Optionally add `GITHUB_PROFILE_LOGIN=chiranjeev-21` as a Config variable.
12. Save, then **redeploy** the relevant branches. Variable changes do not modify
    already-built deployments.
13. Visit the deployment's `/api/github-pinned`. A successful pinned response has
    `"source":"github"` and `"selection":"pinned"`. If it says `"recent"`, check
    token expiration, resource-owner access, and that your profile has public pins.

Never put this token in a `VITE_*` variable, source code, a screenshot, or a commit.
For local development, copy `.env.example` to `.env.local`, fill the optional values,
and restart `npm run dev`. `.env.local` is ignored by git.

## Choose a production design

After comparing previews, merge **one** chosen design branch into `main` through a
pull request. Vercel will build it for the production domain. Do not merge all three
branches: they intentionally choose different default concepts.

For permanent independently branded sites rather than previews, create additional
Vercel projects connected to the same repository and set each project's Production
branch to the corresponding design branch. Configure domains and environment
variables separately. This is optional.

## Local checks

```powershell
npm install
npm run build
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

The current browser suite covers desktop/mobile app layouts, the original PDF,
parsed shell commands, history and completion, shared window identity,
drag/resize/minimize/maximize, the command palette, deep links, settings,
hidden files and vault, local retrieval and measured run recording, blocked
storage, no-JavaScript contact access, and narrow screens. Routine browser tests use fixtures so
an upstream outage cannot masquerade as a UI regression. Screenshots and traces are
written to ignored test output.

Run the separate real-network smoke check when GitHub is reachable:

```powershell
$env:LIVE_GITHUB = '1'
npm run test:e2e -- --grep 'live GitHub smoke'
Remove-Item Env:\LIVE_GITHUB
```

GitHub availability and the unauthenticated REST rate limit can make the opt-in
check fail; the website itself should still show the labeled local fallback.

## References

- [Vercel: Git deployments](https://vercel.com/docs/git)
- [Vercel: Preview and Production environments](https://vercel.com/docs/deployments/environments)
- [Vercel: environment variables](https://vercel.com/docs/environment-variables)
- [GitHub: managing personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

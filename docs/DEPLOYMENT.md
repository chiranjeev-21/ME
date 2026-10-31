# Personal Universe deployment

The cinematic redesign lives on **`feature/cinematic-universe`**. `main`, CJ OS,
the 3D CJ Universe and Engineering Workbench branches are not changed by it.

## Vercel previews

1. Sign in to [Vercel](https://vercel.com/dashboard).
2. Open the existing portfolio project connected to `chiranjeev-21/ME`.
3. Confirm **Settings > Git** still points to this repository.
4. Keep Production branch tracking on **`main`**.
5. In **Deployments**, filter by `feature/cinematic-universe`.
6. Wait for **Ready**, open its details, and use **Visit** or **Copy URL**.
7. Prefer the branch URL for ongoing review; a commit URL is an immutable snapshot.

Vercel normally creates Preview deployments automatically on a non-main branch
push. No separate project, database, model service, or paid API is required.

Build settings are supplied by `vercel.json`:

- Framework: **Vite**
- Build command: **`npm run build`**
- Output directory: **`dist`**
- GitHub API: **`api/github-pinned.js`**, Node function with a bounded upstream request

Preview URLs may use the project's existing **Deployment Protection** and require
Vercel sign-in. A sign-in page does not mean the build failed.

## Direct routes must survive refresh

```text
/projects/cj-os-desktop
/writing/retrieval-is-not-evidence
/playbox
/world/hush?mode=explore        (previous CJ Universe link → /#hush)
```

`vercel.json` rewrites only `/world/*`, `/projects/*`, `/writing/*`, and the
single `/playbox` path to the client entry point. **Do not replace these with a
global rewrite that sends `/api/*` to `index.html`.** Static assets live under
`/images/*`, `/resume/*`,
and `/assets/*` (Earth textures in `/assets/orbit`, credits in
`/assets/CREDITS.txt`). Fonts are self-hosted in the build; no font CDN is used.

## GitHub feed

`GET /api/github-pinned` uses the same handler in Vite development and Vercel.

| Result                                             | Visitor sees                                             |
| -------------------------------------------------- | -------------------------------------------------------- |
| Valid optional token and public pins               | Exact **pinned public repositories**                     |
| No usable token or no public pins                  | Live **recent public repositories**, explicitly not pins |
| GitHub unavailable/rate-limited or no public repos | Clearly labeled **local fallback**                       |

No token is required for the recent-repository feed. Request timeouts and short
fallback caching keep transient failures from turning into a long-lived fake
“live” state. The browser also validates the response.

### Optional: enable exact profile pins

1. Sign in to GitHub and click your avatar, then **Settings**.
2. Open **Developer settings > Personal access tokens > Fine-grained tokens**.
3. Click **Generate new token** and complete authentication.
4. Name it `portfolio-public-pins`, choose an expiration, and select your personal
   account as Resource owner.
5. Choose **Public repositories**. Do not grant private-repository or write access.
6. Leave unnecessary permissions unset, generate the token, and copy it once.
7. In Vercel, open the project, then **Settings > Environment Variables**.
8. Add `GITHUB_TOKEN` as a **Secret** for **Preview** and **Production** as desired.
   Apply it to the `feature/cinematic-universe` preview if branch restrictions are offered.
9. Optionally add `GITHUB_PROFILE_LOGIN=chiranjeev-21` as a Config variable.
10. Save and **redeploy**. Changed variables do not update older deployments.
11. Check `/api/github-pinned`: `"source":"github","selection":"pinned"` confirms
    exact pins. `"recent"` is the usable keyless fallback, not an exact pin result.

Never put this credential in `VITE_*`, source code, screenshots, or commits.
Locally, copy `.env.example` to ignored `.env.local`, fill optional values, and
restart `npm run dev`. Expired credentials should be rotated in Vercel.

## Verification

```powershell
npm ci
npm run build
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

For a production-client smoke check, first build and then set
`PORTFOLIO_PREVIEW=1` when running the browser suite. The preview server is static:
browser fixtures can exercise the client, while the actual function is tested
separately through the development middleware or Vercel.

The opt-in live network check uses `LIVE_GITHUB=1`. Routine tests use deterministic
GitHub fixtures so upstream rate limits are not confused with UI regressions.

## Promote deliberately

After review, merge `feature/cinematic-universe` into `main` through a pull
request. That is the step that changes the production website. Do not merge the
alternate design branches together; they intentionally provide different
experiences.

## References

- [Vercel Git deployments](https://vercel.com/docs/git)
- [Preview and Production environments](https://vercel.com/docs/deployments/environments)
- [Environment variables](https://vercel.com/docs/environment-variables)
- [GitHub personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

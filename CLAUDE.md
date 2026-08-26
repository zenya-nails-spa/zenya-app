# zenya-app

## Project overview

Zenya Nail Spa — salon management app for a nail/spa business in Puebla, Mexico. Five repos, all under the `zenya-nails-spa` GitHub org:

- **`zenya-api`** — FastAPI backend, MySQL via SQLAlchemy, deployed to Cloud Run.
- **`zenya-app`** (this repo) — React frontend (Create React App), the internal admin dashboard, deployed at `/admin` on shared domains.
- **`zenya-ingestor`** — Google Cloud Functions that sync data from AgendaPro (the salon's booking/POS system, no useful export API of its own) into MySQL. This app never talks to AgendaPro or MySQL directly — everything goes through `zenya-api`.
- **`mysql-schema-migrations`** — Liquibase changelogs, the single source of truth for schema.
- **`zenya-landing`** — public marketing/sales site for clients. Completely separate app (no login, no `zenya-api` dependency, own repo/CI). On stage it shares a domain with this repo — see "How stage.zenya.com.mx is actually served" below.

GCP project `zenya-app-476bc`, region `us-central1`. Cloud Run (API) + Firebase Hosting (this repo) + Cloud Functions (ingestor) + Cloud SQL. Environments: `stage` and `prod`, each with its own Cloud Run service / Firebase target / Cloud SQL database, mirrored by the `stage`/`master` git branches (note: `master`, not `main`, is this repo's prod branch).

## This repo

Create React App. Pages in `src/pages/`, reusable UI primitives in `src/components/ui/`, feature widgets in `src/components/widgets/`, all API calls centralized in `src/lib/api.js` (`get`/`post`/`put` wrappers, `X-API-Key` header). No component library — everything is hand-styled with CSS custom properties (`var(--...)`) defined in `src/index.css`; check there before introducing a new color/spacing value.

Run locally:
```bash
npm start   # localhost:3000, needs zenya-api running (default localhost:8001)
npm run lint  # eslint + prettier — PRs are blocked if this fails
```
`.env.development` (gitignored) sets `REACT_APP_API_URL`/`REACT_APP_API_KEY`.

## Working with multiple Claude Code sessions at once

**A session never runs `git checkout`, `git stash`, or `git reset` in this main checkout.** The main checkout is whatever the user (or another session) already has open — treat its branch and working tree as off-limits. All feature work happens in a dedicated `git worktree`, created via:

```bash
scripts/claude-worktree.sh <feature-slug> [port] [api-port]
```

This fetches `origin`, creates `../zenya-app-<slug>` on a fresh `feat/<slug>` branch off `origin/stage`, symlinks `node_modules` (not copied — gitignored, and reinstalling wastes time), writes an `.env.development` pointing at `api-port` (defaults to the canonical 8001; pass the matching `zenya-api` worktree's port if you spun one up too), and picks the next free port ≥ 3010 (or use the port you pass explicitly). It prints the exact `react-scripts start` command. When done: `git worktree remove --force ../zenya-app-<slug>` (`--force` is required — the symlinked `node_modules`/generated `.env.development` show up as untracked files) and `git branch -D feat/<slug>` from the main checkout.

Port table (canonical port = what the main checkout / the user's own manual work uses; never bind these from a worktree):

| Service | Canonical | Worktree range |
|---|---|---|
| `zenya-app` (`react-scripts`) | 3000 | 3010+ |
| `zenya-api` (`uvicorn`) | 8001 | 8010+ |
| `zenya-ingestor sync_bookings` | 8080 | 8090+ |
| `zenya-ingestor sync_clients` | 8081 | 8091+ |
| `zenya-ingestor sync_sales` | 8082 | 8092+ |
| `zenya-ingestor sync_expenses` | 8083 | 8093+ |
| MySQL (`zenya-mysql` Docker) | 3306 | **shared, not per-worktree** |

MySQL is a genuinely shared resource — worktrees isolate code/branches, not data. Two sessions running a migration or writing conflicting test rows at the same time can still collide; be aware of it and clean up any test data you create.

When killing a background dev server process, target it by port (`lsof -ti :<port> | xargs kill`) — a broad `pkill -f react-scripts` will kill *every* CRA instance across *every* worktree, not just yours (this has actually happened — killed another session's server by accident).

## Git / deploy workflow

1. Branch off freshly-pulled `stage` (via the worktree script above, or manually: `git checkout stage && git pull && git checkout -b feat/x`).
2. Implement, test locally in the browser against `localhost:<your-port>`. Run `npm run lint` (or `npx eslint <changed-files> --fix`) before committing — CI blocks on it.
3. **Never commit or deploy until the user has explicitly confirmed the local test worked**, including a real click-through in the browser for UI changes — type-checking/lint verify correctness, not that the feature actually looks/behaves right.
4. `git push -u origin feat/x`, `gh pr create --base stage`.
5. Wait for CI checks (`lint`, `check-source-branch`) before merging — `gh pr checks <n> --watch`. Merging on a race with lint still running has produced a failed merge before.
6. `gh pr merge <n> --merge`.
7. **Always verify the merge isn't stale**: `git fetch origin && git merge-base --is-ancestor <local-sha> origin/stage`. `gh pr merge` has silently merged a stale head commit before (recurring bug) — if the check fails, open a corrective PR with just the missing commit(s).
8. Watch the deploy: `gh run list --branch stage --limit 2` then `gh run watch <run-id> --exit-status`.
9. Verify against the live Firebase-hosted URL, not just "the Action succeeded."

Same flow for prod, base branch **`master`**, after `stage` has been confirmed working.

## How stage.zenya.com.mx is actually served (read before touching firebase.json/deploy-stage.yml)

`stage.zenya.com.mx` used to be this repo's alone (static Hosting, `/admin` only, root 404s). It's now shared with `zenya-landing`: a Firebase Hosting custom domain can only belong to one site, and there's no native way to split static content from two independently-deployed sites by path — so **this repo's `firebase.json` is a pure router, not a static site config anymore**:

```json
"rewrites": [
  { "source": "/admin/**", "run": { "serviceId": "zenya-app-stage", "region": "us-central1" } },
  { "source": "**", "run": { "serviceId": "zenya-landing-stage", "region": "us-central1" } }
]
```

`deploy-stage.yml` now builds `Dockerfile` (nginx serving the existing `/admin`-nested `build/`, via the same "nest build under /admin" step as before — that part is unchanged), pushes it to Cloud Run (`zenya-app-stage`, in project **`zenya-nails-spa-stage`**, not `zenya-app-476bc` where `zenya-api` runs — a Hosting rewrite's `run` target must be in the same project as the Hosting site), *then* deploys the router `firebase.json`. `zenya-landing`'s own repo/CI does the exact same thing independently for its own service — **neither repo's deploy ever touches the other's files**, that's the entire point of this design.

`public-router/` is a placeholder dir Firebase's schema requires even though nothing in it is ever meant to be served (the rewrites are exhaustive). **It must never contain a file literally named `index.html`** — Firebase Hosting resolves an exact static file match before it evaluates rewrites, so an `index.html` there silently shadows the `**` rewrite for `/` (hit this live once, fixed by renaming to `_placeholder.html`).

Prod (`zenya.com.mx/admin`) is **not** set up this way — still plain static Hosting, root unclaimed. Don't assume this pattern is mirrored in prod until someone actually builds it there.

## Gotchas

- **`stage` and `prod` share the same Cloud SQL database** (see `zenya-api`'s `CLAUDE.md`) — testing a feature against the stage-deployed API means testing against real production data. Be careful with anything that writes data while verifying a stage deploy.
- **`wa.me` WhatsApp links are permanently broken** — WhatsApp Desktop corrupts emoji in the text parameter (confirmed via direct testing, no known fix). Always build links with `web.whatsapp.com/send?phone=...&text=...` via `buildWhatsappUrl()` in `src/lib/whatsapp.js`, never `wa.me`.
- **Reminder panels (`appointment-reminders.jsx`, `reminder-campaign-panel.jsx`) use a `live_sync` query param** on their `api.*Reminders()` calls — `live_sync: false` reads whatever the shared backend currently has (fast, no AgendaPro pull, safe to call automatically on mount so every browser shows the same state); `live_sync: true` is the manual "Sincronizar" button, which actually pulls fresh AgendaPro data. Don't collapse this distinction — it's what makes the reminder lists consistent across different browsers/devices instead of each one showing its own stale localStorage snapshot.
- **`DataTable`** (`src/components/widgets/data-table.jsx`) already supports optional `page`/`pageSize` props (slices its own sorted output for display, independent of `onSortedRowsChange` which always gets the full sorted set — used for Excel export) and an opt-in `maxSortKeys` prop (>1 enables multi-column click-to-sort, accumulating priority instead of replacing). Reuse these before building new pagination or sorting from scratch — most list/table pages already lean on this.
- **`Pagination`** (`src/components/ui/pagination.jsx`) + **`usePagination`** hook (`src/hooks/use-pagination.js`) are the shared 25/50/100-per-page control — reuse rather than building a new one per page.
- Gastos-related pages (`gastos.jsx`, the Rendimiento tab in `staff.jsx`) use their **own month picker** (`<input type="month">`), independent of the app's global date-range picker at the top — the underlying data (expenses, payroll) is recorded by month/week in the source Google Sheet, not arbitrary date ranges, so a global range picker would be misleading there.

# return: add-endpoint — executor: developer, branch healthz/add-endpoint

## files

- `services/gateway/src/routes/healthz.ts` — added: GET /healthz handler; 200, literal `{"status":"ok"}`, application/json; zero I/O, zero dependency checks.
- `services/gateway/src/server.ts` — modified: `app.use(healthzRouter)` inserted at line 24, above `app.use(authMiddleware)` (line 27); pre-auth reachability.
- `services/gateway/test/healthz.test.ts` — added: 3 assertions — status 200, exact body, unauthenticated pass (no Authorization header sent).

Diff surface: 3 files, all under `services/gateway/`; +41/-0.

## evidence

- test run: `npm test -w services/gateway` → `PASS test/healthz.test.ts (3 passed, 0 failed)`; full suite 27 passed, 0 failed, 0 skipped.
- live exchange (server on :8080, no auth header):
  `GET /healthz` → `HTTP/1.1 200 OK`, `content-type: application/json; charset=utf-8`, body `{"status":"ok"}`.
- auth exemption: identical request minus credentials → 200 (not 401/403); control: `GET /admin` without credentials → 401, auth chain intact.
- path confinement: `git diff --name-only main` → 3 paths, all `services/gateway/*`.

## gates

- `npm test -w services/gateway` → pass
- `npm run lint -w services/gateway` → pass
- `git diff --name-only main | grep -v '^services/gateway/'` → ∅

## deviations

∅

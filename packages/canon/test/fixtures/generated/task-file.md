# add-endpoint — GET /healthz on `gateway`

## Inputs (static — pinned repo paths)

- `services/gateway/src/server.ts` — express app assembly; route registration + middleware chain order.
- `services/gateway/src/routes/` — one-module-per-route dir; existing route modules fix the export shape.
- `services/gateway/test/` — supertest suites; existing suites fix harness + naming convention.
- `services/gateway/package.json` — test script (`npm test -w services/gateway`); containerPort source of truth: `PORT` default 8080 in `server.ts`.

## Scope

- create `services/gateway/src/routes/healthz.ts`: handler for GET `/healthz` → status 200, body exactly `{"status":"ok"}`, content-type `application/json`. No I/O, no downstream dependency checks — liveness semantics, not readiness. No `/readyz`.
- register the route in `server.ts` BEFORE the auth middleware chain; unauthenticated requests reach it.
- create `services/gateway/test/healthz.test.ts`: assert status 200 ∧ body `{"status":"ok"}` ∧ unauthenticated request (no Authorization header) succeeds.
- diff confined to `services/gateway/`. Out of scope: deploy manifests, metrics, readiness, docs.

## Acceptance (falsifier — decidable from the return alone)

reject r ⇔ any of:
- r lacks {files, evidence, gates} structure.
- evidence lacks a test run naming `healthz.test.ts` with pass status.
- evidence lacks an observed GET /healthz exchange showing 200 + body `{"status":"ok"}`.
- evidence shows 401/403 on unauthenticated GET /healthz (endpoint behind auth).
- files list any path outside `services/gateway/`.
- gates omit a green `npm test -w services/gateway`.
- register(r) ≠ LLM.

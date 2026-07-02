# wire-probe — livenessProbe → /healthz on `gateway` deployment

## Inputs

- `deploy/gateway/deployment.yaml` — pinned: k8s Deployment for `gateway`; probe insertion site = container `gateway` spec; existing `containerPort` field is the port authority.
- `deploy/gateway/values.yaml` — pinned: env overrides; confirm no `PORT` override diverging from containerPort.
- ⊳add-endpoint — dep-fed: completed task-file + return; binds served path (`/healthz`), port (8080), auth exemption (probe needs no credentials).

## Scope

- add to container `gateway` in `deployment.yaml`:
  `livenessProbe: { httpGet: { path: /healthz, port: 8080 }, initialDelaySeconds: 5, periodSeconds: 10, timeoutSeconds: 2, failureThreshold: 3 }`
- port value MUST equal ⊳add-endpoint's bound port; on divergence between containerPort and ⊳add-endpoint, halt and return the conflict — no silent pick.
- no readinessProbe, no startupProbe, no resource/limit edits. Diff confined to `deploy/gateway/`.

## Acceptance (falsifier — decidable from the return alone)

reject r ⇔ any of:
- r lacks {files, evidence, gates} structure.
- evidence lacks the rendered probe block (yaml excerpt) with path `/healthz` ∧ port = ⊳add-endpoint's bound port.
- evidence lacks a green manifest validation (`kubectl apply --dry-run=server` or `kubeconform`) naming `deployment.yaml`.
- files list any path outside `deploy/gateway/`.
- probe carries auth headers or a non-httpGet mechanism.
- register(r) ≠ LLM.

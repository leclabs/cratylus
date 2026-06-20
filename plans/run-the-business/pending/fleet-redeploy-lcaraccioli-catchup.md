# fleet-redeploy-lcaraccioli-catchup

**Owner.** Mav. **Origin.** csf-canonicalization (delivery tail).

**Objective.** Bring the lcaraccioli hosts **upmav** and **upgoose** up to the σ\*\_R corpus
(`origin/main` @ `96d334a`+). They were off-network (TCP timeout) during the csf fleet redeploy
(2026-06-20); the other four hosts (fire/ash/forge/spark) are live.

**Operations.** When each host is reachable, from `packages/mind`:
`deploy.py --kind agent --scope user --host <h> --user lcaraccioli --home <HOME>` then `--kind skill`.
Determine `<HOME>` per host first (`ssh <h> 'echo $HOME; uname -s'`): macOS = `/Users/lcaraccioli`,
Linux = `/home/lcaraccioli`. Use `ssh -o StrictHostKeyChecking=accept-new` on first contact (host-key
refresh) — a plain `BatchMode` reachability probe FALSE-NEGATIVES on an untrusted key (lesson 2026-06-20).

**Acceptance.** Both hosts: 11 agent defs + 13 skills deployed; sidecars **untouched or seeded
if-absent** (never clobbered); a deployed `principal-ic` carries `consensus-quality-pick`.

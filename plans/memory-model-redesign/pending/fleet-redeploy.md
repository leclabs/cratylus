# fleet-redeploy

**Owner.** Nico. **Deps.** redesign-memory-constitution. **Consent-gated** — the irreversible outward act.

**What.** Redeploy the new `memory` constitution (the `render: verbatim` Protocol) to all 6 hosts. Independent of
the machinery track: the Protocol is authored substrate-neutral, so it deploys **once** and needs no second deploy
when JSONL lands.

**Exit criteria.**

- All 6 hosts (fire · upmav · forge · spark · ash · upgoose) at HEAD; each agent def's Protocol sha256-matches the
  render; sidecars preserved.
- Verify the deployed artifact (grep + sha256 vs render), never the deploy exit message.
- Operator consent obtained before deploy.

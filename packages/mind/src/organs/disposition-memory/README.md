# disposition-memory

**Organ (industry name):** _Disposition-Memory_ — a CONATUS standing-drive organ (_persistent · internal_) in the agent's conceptual anatomy.

**What it is.** Disposition-memory is the agent's **durable, identity-level learning**: the preferences, lessons, and self-model that bias future action _across sessions_. Where competence is the repertoire of what an agent _can_ do, disposition-memory is _who it has become_ — the standing inclinations it carries forward because of what it has lived through. It is not per-turn reasoning and not a one-off note; it is the consolidated residue of experience that changes how the agent will act next time, by default, without being told again.

The dimension this organ governs is the **learning mode over time**: _how_ (and whether) lessons persist and reshape behavior between sessions. The values below run from no persistence at all to continuous live adaptation; an agent's binding declares which regime it operates under.

## The canonical values

Each is a value cell (`kind: disposition-memory`); the learning mode is the `≜` claim.

- **[`static-frozen`](static-frozen.md)** — no persistence across runs; behavior fixed by prompt/weights at deploy time, identical every session, lessons never retained.

- **[`in-context-recall`](in-context-recall.md)** — past lessons persist only as retrievable artifacts (notes, logs, vault) injected into context at runtime; the agent reads them but its underlying policy is unchanged between reads.

- **[`episodic-accretion`](episodic-accretion.md)** — concrete experiences are accumulated as discrete recallable episodes (case base) and matched by similarity at decision time; behavior shifts via precedent rather than by abstracting rules.

- **[`curated-promotion`](curated-promotion.md)** — candidate lessons are staged and adopted as durable dispositions only after explicit review/approval (human or gate); adaptation is gated, auditable, and reversible rather than automatic.

- **[`correction-consolidation`](correction-consolidation.md)** — each operator correction or self-caught defect is distilled into a standing disposition across sessions, so a once-made mistake becomes a held inclination rather than a repeated error.

- **[`reflective-revision`](reflective-revision.md)** — revise standing dispositions by reflecting on experience — distil lessons from outcomes and rewrite the behavioral policy, not merely recall facts.

- **[`continual-online`](continual-online.md)** — policy/weights update incrementally from a live experience stream during operation (RL/online learning); behavior drifts continuously, no redeploy.

## How an agent binds a value

An agent binds a value by citing `disposition-memory [[value]]` in its `agent/<name>.md` selection vector — the vector is the single source of truth. The cited cell supplies the **policy** (the learning regime the agent runs under); the agent's actual _content_ of dispositions — the specific lessons it has consolidated — accrues over its lived sessions and is recorded through the agent's memory home, not restated in the corpus. One law, many lived instances.

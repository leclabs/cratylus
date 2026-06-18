# fleet-sync-organs

**Owner.** Mav. **Deps.** jsonl-episodic-store.

**What.** Make the agent-global organs (SELF, MEMORY, EPISODIC.jsonl) **one logical store** synced to every host
(synced dir or git repo) — never host-local, never absolute-path-bound. Project/subtree guidance lives in the repo
and travels via git. Host-specific facts are knowledge the agent holds → MEMORY, never per-host files.

**Exit criteria.**

- An organ edit on host A is present on host B after sync; an agent wakes as the **same person** on any host.
- No absolute home leaks into a synced organ (portable across lex vs lcaraccioli roots).
- Nico re-verifies one-person-across-fleet himself.

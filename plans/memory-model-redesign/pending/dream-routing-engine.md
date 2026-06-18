# dream-routing-engine

**Owner.** Mav. **Deps.** jsonl-episodic-store.

**What.** The dream routing pass over EPISODIC.jsonl. Per event: (1) **voice → organ** (identity→SELF ·
my-knowledge→MEMORY · directive-for-any-agent→AGENTS.md · reference→vault); (2) **locality → scope**
(everywhere→agent-global · this-repo→project · this-subtree→subtree); (3) resolve `(organ, scope) → file`, where
one event may **split** to several homes; (4) most episodic events → `drop` (scaffolding that graduates nowhere).
Then write back `routes` and **compact** consumed lines (rewrite the log minus consumed ids; atomic tmp + mv).
Goal: metabolize episodic memory, keep SELF/MEMORY small enough to load whole.

**Exit criteria.**

- A mixed batch routes correctly (identity→SELF, knowledge→MEMORY, directive→AGENTS, ref→vault, scaffold→drop);
  one event can land in multiple homes.
- Consumed lines are compacted atomically; SELF/MEMORY stay bounded across many cycles.
- Nico re-verifies routing correctness himself.

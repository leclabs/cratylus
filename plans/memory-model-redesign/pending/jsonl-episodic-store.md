# jsonl-episodic-store

**Owner.** Mav. **Deps.** redesign-memory-constitution (the schema-spec).

**What.** Implement EPISODIC as a portable JSONL event log per the spec: ULID id generation (lexicographically
time-sortable), append-only encode of an open record `{id, scope, path?, body}` (no `kind` forced at capture), and
`resolveFile(scope, path)` — scope-relative → absolute: `user → agentHome()/path`; `project:<key> →
projectRoot(key)/path`. No absolute-path storage; no `home` or `fid` fields.

**Exit criteria.**

- Encode appends a valid, ULID-keyed JSONL line; lines sort by time lexicographically.
- `resolveFile` round-trips on two hosts with different home roots (lex vs lcaraccioli) → the same logical store.
- Nico re-verifies the portability gate himself (not the build's self-report).

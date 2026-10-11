# Direct-launch binding: seen red

`pnpm --filter cratylus exec vitest run --config ../../design/judgment/agents/reconstitution/binding/vitest.config.ts`

Observed: one test, one assertion failure.

- Example: **held-out agents/1**.
- Check: `structural.test.ts`, `held-out agents/1 — direct lead launch cannot bypass the missing-examples contract`.
- `seenRed: true`.
- Reason: a main session launched as the installed lead received the typed assignment with concepts and decisions but no examples; its `before_agent_start` hook neither refused nor threw. The assertion requiring a refusal failed (`expected undefined to be defined`).
- No model call ran. The generated installed extension was loaded with mocked omp services, as in forge's extension tests. No import or fixture failure is counted as red evidence.

This directory has its own Vitest config and installation setup. Run it again only for judgment after the build; keep it out of builder assignments.

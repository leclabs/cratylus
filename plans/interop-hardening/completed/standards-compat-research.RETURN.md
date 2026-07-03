# standards-compat-research — RETURN

Executed 2026-07-02 (nico dispatch, interop-hardening wave 0). Method: 5 parallel web-research
agents + independent first-hand fetches of every canonical spec page and the crux matrix cells
(agents.md, agentskills.io/specification, Codex/Cursor/Copilot/Gemini skills docs). Markers:
**[1P]** first-party docs/changelog · **[C]** community/secondary · **UNVERIFIED** no citable
source found. Citations `[Sn]` resolve in the source ledger at the end; every matrix cell carries
one or is marked UNVERIFIED.

---

## 1 · Normative summaries of the industry-backed specs

### 1.1 Agent Skills (SKILL.md)

**Canonical URL** https://agentskills.io/specification · repo github.com/agentskills/agentskills
[S6]. **Provenance/date:** developed by Anthropic, shipped as a Claude feature 2025-10-16,
**published as an open standard 2025-12-18** [S5]. **No version number, no changelog** — a living
spec under the `agentskills` GitHub org (code Apache-2.0, docs CC-BY-4.0) [S6]. NOT donated to a
foundation (unlike MCP and AGENTS.md → Agentic AI Foundation); remains Anthropic-originated,
community-open [S5][S48].

**Normative content** [S3]:

- A skill ≜ a directory containing at minimum `SKILL.md`; optional `scripts/` (executable),
  `references/` (on-demand docs), `assets/` (templates/data), plus any other files.
- `SKILL.md` = YAML frontmatter + free-form Markdown body. Frontmatter fields:

| field           | req | constraints                                                                                      |
| --------------- | --- | ------------------------------------------------------------------------------------------------ |
| `name`          | yes | 1–64 chars; `[a-z0-9-]`; no leading/trailing/consecutive hyphens; **must equal parent dir name** |
| `description`   | yes | 1–1024 chars; what + when-to-use                                                                 |
| `license`       | no  | name or bundled-file reference                                                                   |
| `compatibility` | no  | 1–500 chars; environment requirements; "most skills do not need it"                              |
| `metadata`      | no  | arbitrary string→string map for client extensions                                                |
| `allowed-tools` | no  | space-separated pre-approved tools; **experimental**, support varies                             |

- Body: no format restrictions; recommended < 5000 tokens / **SKILL.md under 500 lines**; file
  references relative to skill root, one level deep.
- **Progressive disclosure (3 levels):** (1) `name`+`description` (~100 tokens) loaded at startup
  for all skills; (2) full body on activation; (3) bundled files on demand.
- **Discovery location is deliberately NOT in the spec** — it defines only the directory's
  contents; the companion implementer guide recommends scanning `.agents/skills/` "so skills
  installed by other compliant clients are automatically visible to yours" [S3][S60].
- Validation: reference library `skills-ref validate ./my-skill` [S6].
- Adoption: ~40 clients on the official showcase incl. Claude Code/Claude, OpenAI Codex, Cursor,
  GitHub Copilot, VS Code, Gemini CLI, OpenCode, Amp, Goose, Roo Code, Kiro, Factory, Junie,
  OpenHands, Letta, Trae, Mistral Vibe, Spring AI, Snowflake, Databricks [S4].

### 1.2 AGENTS.md

**Canonical URL** https://agents.md · repo github.com/agentsmd/agents.md (~22.7k★, MIT) [S1][S2].
**Provenance/date:** launched Aug 2025 out of OpenAI Codex + Amp + Jules + Cursor + Factory;
**donated to the Agentic AI Foundation (Linux Foundation) 2025-12-09** — site FAQ: "now stewarded
by the Agentic AI Foundation under the Linux Foundation" [S1][S48]. Still effectively a one-page
v1.0 convention in mid-2026.

**Normative content** [S1] — the spec is intentionally thin:

- Filename `AGENTS.md`, standard Markdown at repo root; **no required fields, no frontmatter, no
  required headings** ("a README for agents").
- **Nesting:** multiple AGENTS.md in subdirectories for monorepos; "the closest AGENTS.md to the
  edited file wins."
- **Precedence:** "explicit user chat prompts override everything."
- Says nothing about `~/` global scope, `.agents/`, or skills — all per-harness territory.
- **Semantics divergence to note:** the FAQ describes closest-wins _replacement_; Codex — the
  richest implementation — _concatenates_ root→cwd with closer files winning positionally, global
  `~/.codex/AGENTS.override.md` → `~/.codex/AGENTS.md` above that, 32 KiB default cap,
  `project_doc_fallback_filenames` to accept alternate names [S9].
- Adoption claim: "used by over 60k open-source projects"; official adopter list (23 tools):
  Codex, Jules, Factory, Aider, goose, opencode, Zed, Warp, VS Code, Devin, UiPath, Junie
  (JetBrains), Amp, Cursor, RooCode, Gemini CLI, Kilo Code, Phoenix, Semgrep, GitHub Copilot
  coding agent, Ona, Windsurf, Augment Code [S1]. Notably absent: **Claude Code**.
- Extension proposals (frontmatter/description/tags #10/#135, tool-permissions #105,
  `.agents/rules/` #179) are all **open issues, unmerged** — there is no AGENTS.md v2 [S2][S59].

### 1.3 `.agents/` directory

**No single owner defines `.agents/`** — it is absent from the agents.md spec [S1][S2] and from
the Agent Skills spec proper [S3]. It hardened bottom-up as the **vendor-neutral discovery home
for Agent Skills**, seeded by the agentskills.io implementer guidance [S60] and Codex's launch
choice, then matched by every major adopter:

- `.agents/skills/` (project, often walked cwd→repo root) + `~/.agents/skills/` (user): read
  first-party by **Codex** [S10], **Cursor** [S20], **GitHub Copilot** [S14], **Gemini CLI**
  (alias that _wins over_ `.gemini/skills/` within a tier) [S12], **Zed** (its _only_ skill
  paths) [S30], **Amp** [S28], **Goose** [S54], **Crush** [S27], **OpenCode** [S26], **Roo Code**
  [S24].
- `~/.agents/AGENTS.md` — global instructions (Cline first-party [S22]; Goose per release notes,
  UNVERIFIED against rendered docs).
- `.agents/commands/`, `.agents/tools/` — Amp-only conventions [S28]; `.agents/types/` —
  Codebuff-only [S53]; `.agents/rules/` — proposal only (agentsmd#179) [S59].
- Codex additionally reads `/etc/codex/skills` (admin) and **follows symlinked skill folders**
  [S10]; Zed's docs give official symlink guidance for pointing at other locations [S30].

### 1.4 Sibling conventions hardening (or not) in 2025–26

**`.cursor/rules`-class per-vendor rules dirs — converged in shape, NOT in location; zero native
cross-reads.** Cursor `.cursor/rules/*.mdc` (frontmatter `description`/`globs`/`alwaysApply`;
legacy `.cursorrules` deprecated) [S19]; Windsurf→Devin `.windsurf/rules/`→`.devin/rules/`
(`trigger: always_on|model_decision|glob|manual`, 12k-char cap) [S32]; Cline `.clinerules/`
(paths-glob frontmatter) [S22]; Roo `.roo/rules/` + per-mode [S23]; Continue `.continue/rules/`
[S58]; Kiro `.kiro/steering/` (`always|fileMatch|manual|auto`) [S37]; Trae `.trae/rules/` [S52].
The frontmatter vocabulary (description + globs + always-apply) is convergent; the file locations
are proudly per-vendor, bridged only by shim tools (rulesync, Ruler, ai-rules-sync) [S61].

**`.github/` Copilot surfaces** [S13][S57]: `.github/copilot-instructions.md` (repo-wide);
`.github/instructions/*.instructions.md` (`applyTo` glob frontmatter); `.github/prompts/*.prompt.md`
(experimental); `.github/agents/*.md` (custom agents: frontmatter name/description/tools/MCP);
`.github/skills/` (Copilot's own Agent Skills project path [S14]);
`.github/workflows/copilot-setup-steps.yml`. Copilot's cloud agent also reads root **CLAUDE.md and
GEMINI.md** first-party [S13] — the notable one-way cross-adoption in the rules class.

**MCP config touchpoints — protocol standardized, config location NOT.** Spec latest final
revision **2025-11-25**, RC dated 2026-07-28 pending; governed by the Agentic AI Foundation since
2025-12-09 [S43][S55][S48]. The inner `mcpServers` JSON object is a de-facto shared idiom
(Claude `.mcp.json` [S44], Cursor `.cursor/mcp.json` [S45], Gemini `.gemini/settings.json` [S11],
Windsurf global `mcp_config.json` [S32]), but VS Code uses root key `servers` in `.vscode/mcp.json`
[S46] and Codex uses TOML `[mcp_servers.<id>]` in `~/.codex/config.toml` [S47]. No ratified
`mcp.json` file standard exists.

**Net 2025–26 convergence:** exactly three formats hardened into standards — **AGENTS.md**
(instructions), **Agent Skills/SKILL.md** (capabilities), **MCP** (tools/context) — with `.agents/`
crystallizing as the neutral dot-dir of the first two's ecosystem. Universal-`.ai/`-dir proposals
gained no traction (UNVERIFIED that any formal one exists with adoption).

---

## 2 · Cross-compatibility matrix

Codes: **✓**=native first-party · **fb**=first-party fallback (used when own file absent) ·
**cfg**=first-party but requires configuration · **ln**=official one-time link/import/init shim ·
**✗**=documented absent or docs-silent with corroborating open issue · **U**=UNVERIFIED.
Columns: what the harness reads of OTHER ecosystems' formats.

| Harness                                      | CLAUDE.md                                                                                                             | .claude/skills                                                          | AGENTS.md (nested?)                                                                                                                                                                                         | Agent Skills SKILL.md                                                                                                                        | .agents/                                                                                                   | Other cross-reads                                                                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| **Claude Code**                              | ✓ own [S7]                                                                                                            | ✓ own [S8]                                                              | **✗** — "Claude Code reads CLAUDE.md, not AGENTS.md"; official shim = `@AGENTS.md` import or `ln -s AGENTS.md CLAUDE.md` [S7]; native support absent from changelog through 2026-07 [S62], open issue [S49] | ✓ (own paths only: `~/.claude/skills`, `.claude/skills` incl. parent+nested, plugins) [S8]                                                   | ✗ (open issue) [S49]                                                                                       | `/init` one-time ingests `.cursorrules`, `.devin/rules/`, `.windsurfrules`, existing AGENTS.md [S7]                                         |
| **OpenAI Codex**                             | cfg (`project_doc_fallback_filenames` accepts any name) [S9]                                                          | U (undocumented)                                                        | ✓ concat root→cwd, nested; `~/.codex/AGENTS(.override).md`; 32 KiB cap [S9]                                                                                                                                 | ✓ [S10]                                                                                                                                      | ✓ `.agents/skills` cwd→root · `~/.agents/skills` · `/etc/codex/skills`; **follows symlinks** [S10]         | `agents/openai.yaml` skill metadata extension [S10]                                                                                         |
| **Gemini CLI**                               | cfg via `context.fileName` list [S11]                                                                                 | ✗ (no mention) [S12]                                                    | cfg via `context.fileName`; make-default proposal **closed not-planned** [S11][S50]                                                                                                                         | ✓ (preview v0.23.0, 2026-01 [C]) [S12]                                                                                                       | ✓ `.agents/skills/` + `~/.agents/skills/` aliases; alias wins within tier [S12]                            | GEMINI.md hierarchical own [S11]                                                                                                            |
| **GitHub Copilot** (cloud agent/CLI/VS Code) | ✓ cloud agent reads root CLAUDE.md + GEMINI.md [S13]; VS Code `chat.useClaudeMdFile` [S17]; CLI: AGENTS.md only [S13] | ✓ project `.claude/skills` [S14]; VS Code also `~/.claude/skills` [S18] | ✓ coding agent since 2025-08-28 (nested) [S15]; CLI [S51]; VS Code (nested experimental) [S17]                                                                                                              | ✓ since 2025-12-18, all surfaces; `gh skill` CLI 2026-04 [S16]                                                                               | ✓ `.agents/skills` + `~/.agents/skills` [S14]                                                              | `.github/*` own surfaces [S57]                                                                                                              |
| **Cursor**                                   | ✓ CLI reads root CLAUDE.md [S21]; IDE U                                                                               | ✓ compat: `.claude/skills`, `.codex/skills`, `~` variants [S20]         | ✓ root + subdirectories [S19]                                                                                                                                                                               | ✓ [S20]                                                                                                                                      | ✓ `.agents/skills/` + `~/.agents/skills/` [S20]                                                            | own `.cursor/rules` (.mdc) [S19]                                                                                                            |
| **Cline**                                    | ✗ (docs cross-read list omits it) [S22]                                                                               | U                                                                       | ✓ + global `~/.agents/AGENTS.md`; nested U [S22]                                                                                                                                                            | U                                                                                                                                            | partial: `~/.agents/AGENTS.md` ✓ [S22]; `.agents/skills` U                                                 | ✓ `.cursorrules`, `.windsurfrules` (toggleable) [S22]                                                                                       |
| **Roo Code**                                 | ✗ (not in load order) [S23]                                                                                           | U                                                                       | ✓ default on, `AGENT.md` fallback, recursive subdirs; symlinks resolved [S23]                                                                                                                               | ✓ `.roo/skills/` → `.agents/skills/` → `~` variants [S24]                                                                                    | ✓ (skills) [S24]                                                                                           | own `.roo/rules/` [S23]                                                                                                                     |
| **OpenCode**                                 | fb project CLAUDE.md; global `~/.claude/CLAUDE.md` [S25]                                                              | ✓ ("Claude-compatible") [S26]                                           | ✓ primary, walk-up; global `~/.config/opencode/AGENTS.md` [S25]                                                                                                                                             | ✓ [S26]                                                                                                                                      | ✓ `.agents/skills/` + `~/.agents/skills/` [S26]                                                            | `instructions[]` globs arbitrary files incl. `.cursor/rules/*.md` [S25]                                                                     |
| **Crush**                                    | ✓ in context precedence list (+ `.local`) [S27]                                                                       | ✓ (skills path) [S27]                                                   | ✓ (+ `/init` writes it) [S27]                                                                                                                                                                               | ✓ [S27]                                                                                                                                      | ✓ `.agents/skills` [S27]                                                                                   | ✓ `.github/copilot-instructions.md`, `.cursorrules`, `.cursor/rules/`, GEMINI.md, `.cursor/skills` [S27]                                    |
| **Amp**                                      | fb (AGENT.md or CLAUDE.md when no AGENTS.md) [S28]                                                                    | ✓ in skill precedence (`.claude/skills/`, `~/.claude/skills/`) [S28]    | ✓ primary, nested subtree, system/user levels [S28]                                                                                                                                                         | ✓ [S28]                                                                                                                                      | ✓ `.agents/skills/`, `~/.agents/skills/`, `~/.config/agents/skills/`; own `.agents/commands                | tools` [S28]                                                                                                                                | toolboxes retired [S28] |
| **Zed**                                      | ✓ in first-match rules chain [S29]                                                                                    | ✗ (skills only from `.agents/skills`) [S30]                             | ✓ in chain (AGENT.md, AGENTS.md); `~/.config/zed/AGENTS.md` [S29]                                                                                                                                           | ✓ [S30]                                                                                                                                      | ✓ only skill paths: `<worktree>/.agents/skills/`, `~/.agents/skills/`; **official symlink guidance** [S30] | chain: `.rules`, `.cursorrules`, `.windsurfrules`, `.clinerules`, `.github/copilot-instructions.md`, GEMINI.md — **first match only** [S29] |
| **Goose**                                    | cfg via `CONTEXT_FILE_NAMES` [S31]; `.claude/skills` back-compat ✓ [S54]                                              | ✓ back-compat [S54]                                                     | ✓ default ("AGENTS.md then .goosehints") [S31]                                                                                                                                                              | ✓ [S54]                                                                                                                                      | ✓ `.agents/skills/` + `~/.agents/skills/` recommended [S54]                                                | own `.goosehints` [S31]                                                                                                                     |
| **Windsurf → Devin Desktop**                 | U                                                                                                                     | U                                                                       | ✓ auto-discovered; root=always-on, subdir=auto-glob [S32]                                                                                                                                                   | U first-party                                                                                                                                | U                                                                                                          | own `.windsurf/rules/`→`.devin/rules/` [S32]                                                                                                |
| **Factory Droid**                            | U (no doc; third-party claims uncorroborated)                                                                         | ✗                                                                       | ✓ nearest-wins, nested; `~/.factory/AGENTS.md` [S33]                                                                                                                                                        | ✓ `.factory/skills/`, `~/.factory/skills/` + compat root docs render as `.agent/skills/` (singular — re-quote before load-bearing use) [S34] | partial (compat skills root) [S34]                                                                         | own `.factory/droids/` [S34]                                                                                                                |
| **Jules**                                    | ✗ [S35]                                                                                                               | ✗                                                                       | ✓ root only [S35]                                                                                                                                                                                           | U                                                                                                                                            | U                                                                                                          | —                                                                                                                                           |
| **Devin (cloud)**                            | ✓ knowledge auto-ingest [S36]                                                                                         | U                                                                       | ✓ [S36]                                                                                                                                                                                                     | U                                                                                                                                            | U                                                                                                          | ✓ ingests `.rules`, `.mdc`, `.cursorrules`, `.windsurf` — broadest documented cross-read set [S36]                                          |
| **Kiro**                                     | ✗ (no mention) [S37]                                                                                                  | ✗                                                                       | ✓ always-included (no inclusion modes) [S37]                                                                                                                                                                | ✓ [S4]                                                                                                                                       | U (paths)                                                                                                  | own `.kiro/steering/` [S37]                                                                                                                 |
| **Warp**                                     | ln only (`/init` links into AGENTS.md) [S38]                                                                          | ✗                                                                       | ✓ default; legacy WARP.md wins if both [S38]                                                                                                                                                                | U                                                                                                                                            | U                                                                                                          | ln: `.cursorrules`, AGENT.md, GEMINI.md, `.clinerules`, `.windsurfrules`, copilot-instructions [S38]                                        |
| **Qwen Code**                                | U (`contextFileName` likely; semantics unquoted) [S39]                                                                | ✗                                                                       | ✓ "Qwen reads that too" [S39]                                                                                                                                                                               | U                                                                                                                                            | U                                                                                                          | own QWEN.md hierarchy [S39]                                                                                                                 |
| **Aider**                                    | ✗                                                                                                                     | ✗                                                                       | ✗ auto (manual `--read`/`.aider.conf.yml read:` only) [S40]                                                                                                                                                 | ✗                                                                                                                                            | ✗                                                                                                          | CONVENTIONS.md convention, manual [S40]                                                                                                     |
| **Continue**                                 | U/✗                                                                                                                   | ✗                                                                       | ✗ (open issue #6716) [S41]                                                                                                                                                                                  | ✗                                                                                                                                            | ✗                                                                                                          | own `.continue/rules/` [S58]                                                                                                                |
| **Trae**                                     | U                                                                                                                     | U                                                                       | ✓ [S52]                                                                                                                                                                                                     | ✓ [S4]                                                                                                                                       | U                                                                                                          | own `.trae/rules/` [S52]                                                                                                                    |
| **Augment CLI**                              | ✓ hierarchical ("Compatible with Claude Code") [S42]                                                                  | ✗                                                                       | ✓ hierarchical [S42]                                                                                                                                                                                        | U                                                                                                                                            | U                                                                                                          | own `.augment-guidelines`, `.augment/rules/` [S42]                                                                                          |
| **Codebuff**                                 | ✓ fallback chain knowledge.md→AGENTS.md→CLAUDE.md [S53]                                                               | U                                                                       | ✓ [S53]                                                                                                                                                                                                     | U                                                                                                                                            | own `.agents/types/` [S53]                                                                                 | own knowledge.md [S53]                                                                                                                      |

**Matrix asymmetries that matter:**

1. **AGENTS.md is the de-facto interchange format** — native in every surveyed harness except
   Claude Code (official symlink/import shim [S7]), Aider, Continue, and config-gated Gemini/Qwen.
2. **CLAUDE.md is the second-most cross-read context file** (Copilot cloud agent + VS Code, Cursor
   CLI, Crush, Zed, Devin, Augment, Codebuff, OpenCode/Amp as fallback) — Claude Code's own format
   travels even though Claude Code reads nobody else's.
3. **`.claude/skills/` is cross-read first-party** by Cursor, Copilot, VS Code, OpenCode, Amp,
   Goose, Crush — but not by Codex, Gemini CLI, or Zed, whose neutral path is `.agents/skills/`.
4. Symlinks are first-class in practice: Codex follows symlinked skill dirs [S10], Zed recommends
   them [S30], Roo resolves them for AGENTS.md [S23], Anthropic documents `ln -s AGENTS.md
CLAUDE.md` [S7]. Community shims (rulesync, Ruler, ai-rules-sync) bridge the rest [S61].

---

## 3 · Ranked shortlist — output targets by reach per unit of adapter work

Reach counted against the matrix, with agent-forge's 10 adapter targets (claude, opencode, codex,
gemini, copilot, cursor, cline, crush, aider, continue) called out. Ranking metric: (harnesses
reached natively) ÷ (adapter/serializer work + lossiness handling).

**R1 — `AGENTS.md` (root + nested per package).** One free-form Markdown file ⇒ ~20 harnesses
first-party (6/10 forge targets native: codex, copilot, cursor, opencode, crush, cline; +2 config:
gemini, aider; matrix §2). Zero schema to serialize (no required fields [S1]); nesting gives
monorepo scoping for free where supported (Codex, Copilot, Cursor, VS Code, Amp, Windsurf,
Factory, Roo-opt-in [S9][S15][S19][S32][S33][S23]). Highest reach-per-work of any artifact in the
survey; it is the canonical projection target for Rule-type IR resources.

**R2 — Agent Skills `SKILL.md` emitted to `.agents/skills/`, spec-strict core.** One directory
tree ⇒ Codex, Cursor, Copilot/VS Code, Gemini CLI (alias wins over `.gemini/`), Zed (only path),
Amp, Goose, Crush, OpenCode, Roo — 6/10 forge targets native [S10][S20][S14][S12][S30][S28][S54]
[S27][S26][S24]. Emit only spec fields (`name`, `description`, `license`, `compatibility`,
`metadata`, `allowed-tools`) in the shared core [S3]; harness-specific extensions (Claude's
`context: fork`/`agent`/`hooks`, Codex's `agents/openai.yaml`, Cursor's `paths`) are per-adapter
lossy extras — exactly agent-forge's declared-support model. Skills are also the
forward-compatible carrier for command-like assets (Claude Code merged `.claude/commands` into
skills [S8]).

**R3 — `.claude/skills/` as a mirror of R2's tree (symlink where the OS allows, copy fallback).**
Near-zero marginal work closes the two coverage gaps in opposite directions: `.claude/skills/`
adds Claude Code (which ignores `.agents/`), while Cursor/Copilot/VS Code/OpenCode/Amp/Goose/Crush
already read it too [S8][S20][S14][S18][S26][S28][S54][S27]. R2 ∪ R3 = 7/10 forge targets covered
by ONE authored skill tree (all but cline-U, aider, continue). Symlink direction: author once,
link the other — Codex follows symlinks [S10]; Windows needs the copy fallback.

**R4 — `CLAUDE.md` as a pure projection of AGENTS.md (`@AGENTS.md` import, or symlink).** Zero
content work — Anthropic's own documented shim [S7]; the import form is Windows-safe. Also
harvests the harnesses that prefer CLAUDE.md when both exist. Together R1+R4 make the instruction
layer complete: every surveyed harness except Continue/Aider reads the pair natively or via its
own documented fallback.

**R5 — MCP server config: one canonical `mcpServers` model, thin per-client serializers.** The
protocol is the standard; the file is not. One IR model + five trivial transforms — `.mcp.json`
(Claude [S44]), `.cursor/mcp.json` [S45], `.vscode/mcp.json` with `servers` root key [S46],
`.gemini/settings.json` [S11], Codex `config.toml` TOML tables [S47]. Medium reach, low-medium
work, no convergence to wait for (the AAIF governs the wire protocol, not config files [S48]).

**R6 — vendor rules dirs (`.cursor/rules` class) only where scoping semantics demand.** Zero
native cross-reads anywhere in the matrix; emit `.cursor/rules/*.mdc`, `.github/instructions/`,
`.clinerules/`, `.roo/rules/`, `.continue/rules/`, `.kiro/steering/` only for what AGENTS.md
cannot express (glob-scoped/always-on/manual activation) [S19][S57][S22][S23][S58][S37]. The
frontmatter shapes rhyme (description/globs/alwaysApply|trigger), so one IR `Rule` resource with
activation metadata compiles to all — but each target buys exactly one harness.

**R7 — everything else (subagents, commands, hooks) stays fully per-vendor.** `.claude/agents`,
`.opencode/agents|commands`, `.github/agents|prompts`, `.factory/droids`, Amp's `.agents/commands`
— no cross-reads, no emerging standard; lowest reach per work; keep as ordinary lossy adapters.

**Standing cautions for the story task:** (i) do not build on `.agents/rules/` or AGENTS.md
frontmatter — open proposals, unmerged [S59]; (ii) the Agent Skills spec is unversioned — pin
conformance to `skills-ref validate` [S6]; (iii) AGENTS.md merge semantics differ (replacement per
FAQ vs Codex concatenation [S1][S9]) — emitted nested files must be self-sufficient, not
delta-encoded; (iv) watch Claude Code: native AGENTS.md remains its most-upvoted open request
[S49] and would collapse R4 to zero work.

---

## Source ledger

- S1 https://agents.md (fetched 2026-07-02)
- S2 https://github.com/agentsmd/agents.md
- S3 https://agentskills.io/specification (fetched 2026-07-02)
- S4 https://agentskills.io + /clients (official client showcase, fetched 2026-07-02)
- S5 https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills (open-standard update note 2025-12-18); press: https://venturebeat.com/technology/anthropic-launches-enterprise-agent-skills-and-opens-the-standard
- S6 https://github.com/agentskills/agentskills (incl. /skills-ref)
- S7 https://code.claude.com/docs/en/memory
- S8 https://code.claude.com/docs/en/skills
- S9 https://developers.openai.com/codex/guides/agents-md
- S10 https://developers.openai.com/codex/skills (fetched 2026-07-02)
- S11 https://geminicli.com/docs/cli/gemini-md/ ; https://google-gemini.github.io/gemini-cli/docs/get-started/configuration.html
- S12 https://geminicli.com/docs/cli/skills/ (fetched 2026-07-02; "Last updated: Apr 30, 2026")
- S13 https://docs.github.com/en/copilot/reference/custom-instructions-support
- S14 https://docs.github.com/en/copilot/concepts/agents/about-agent-skills (fetched 2026-07-02)
- S15 https://github.blog/changelog/2025-08-28-copilot-coding-agent-now-supports-agents-md-custom-instructions/
- S16 https://github.blog/changelog/2025-12-18-github-copilot-now-supports-agent-skills/ ; https://github.blog/changelog/2026-04-16-manage-agent-skills-with-github-cli/
- S17 https://code.visualstudio.com/docs/agent-customization/custom-instructions
- S18 https://code.visualstudio.com/docs/copilot/customization/agent-skills
- S19 https://cursor.com/docs/context/rules
- S20 https://cursor.com/docs/context/skills (fetched 2026-07-02)
- S21 https://cursor.com/docs/cli/using
- S22 https://docs.cline.bot/customization/cline-rules
- S23 https://docs.roocode.com/features/custom-instructions ; https://github.com/RooCodeInc/Roo-Code/pull/10446
- S24 https://docs.roocode.com/features/skills
- S25 https://opencode.ai/docs/rules/
- S26 https://opencode.ai/docs/skills/
- S27 https://github.com/charmbracelet/crush ; https://charmbracelet-crush.mintlify.app/guides/context-files
- S28 https://ampcode.com/manual (#agent-skills, #AGENTS.md); history https://ampcode.com/news/AGENTS.md
- S29 https://zed.dev/docs/ai/rules
- S30 https://zed.dev/docs/ai/skills
- S31 https://github.com/block/goose/blob/main/documentation/docs/guides/context-engineering/using-goosehints.md
- S32 https://docs.devin.ai/desktop/cascade/agents-md (ex docs.windsurf.com, 307-redirect observed); memories/rules: https://docs.devin.ai/desktop/cascade/memories
- S33 https://docs.factory.ai/cli/configuration/agents-md
- S34 https://docs.factory.ai/cli/configuration/skills
- S35 https://jules.google/docs/ (announced https://jules.google/docs/changelog/2025-06-20/)
- S36 https://docs.devin.ai/onboard-devin/knowledge-onboarding
- S37 https://kiro.dev/docs/steering/
- S38 https://docs.warp.dev/agent-platform/capabilities/rules/
- S39 https://qwenlm.github.io/qwen-code-docs/en/users/features/memory/
- S40 https://aider.chat/docs/usage/conventions.html
- S41 https://github.com/continuedev/continue/issues/6716
- S42 https://docs.augmentcode.com/cli/rules
- S43 https://modelcontextprotocol.io/specification/2025-11-25
- S44 https://code.claude.com/docs/en/mcp
- S45 https://cursor.com/docs/mcp
- S46 https://code.visualstudio.com/docs/agents/reference/mcp-configuration
- S47 https://developers.openai.com/codex/config-reference
- S48 https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation ; https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation ; https://techcrunch.com/2025/12/09/openai-anthropic-and-block-join-new-linux-foundation-effort-to-standardize-the-ai-agent-era/
- S49 https://github.com/anthropics/claude-code/issues/31005 (also #34235)
- S50 https://github.com/google-gemini/gemini-cli/issues/12345 (closed not-planned)
- S51 https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions
- S52 https://docs.trae.ai/ide/rules ; https://docs.trae.ai/ide/skills
- S53 https://www.codebuff.com/docs/tips/knowledge-files (from official-docs snippets; re-quote before load-bearing use)
- S54 https://goose-docs.ai/docs/guides/context-engineering/using-skills/ (block.github.io rendered path 404s post-restructure; same content in S31's repo tree)
- S55 https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/ ; roadmap https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/
- S57 https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot ; custom agents https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-custom-agents
- S58 https://docs.continue.dev/customize/deep-dives/rules
- S59 https://github.com/agentsmd/agents.md/issues/179 ; #10, #135, #105
- S60 https://agentskills.io/client-implementation/adding-skills-support
- S61 https://github.com/dyoshikawa/rulesync ; https://github.com/intellectronica/ruler ; https://github.com/PanisHandsome/ai-rules-sync
- S62 https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md (zero AGENTS.md entries through 2026-07)

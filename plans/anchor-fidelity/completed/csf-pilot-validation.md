# csf-pilot-validation

**State:** completed · **Owner:** Nico · **Deps.** csf-formalism

**What.** Before landing the model into the constitution, validate it on real cells (it had passed
_comprehension_ via blind reads but never been _run_ on the corpus).

**Result — validated.** Ran CSF over the diagnostic sample (`anchor`, `precise-circumscription`,
`densest-faithful-point`, `anchoring-is-self-similar`, `minimalism`, `do-the-work-dont-tell-the-user`):

- **Found the unextracted primitive** behind the `anchor` cluster — the _argmin of symmetric difference
  between an evoked region and a target extension_. `precise-circumscription` = that argmin @ name-grain;
  `densest-faithful-point` = same argmin @ expression-grain (a composite); `anchoring-is-self-similar` =
  the scale-invariance of the primitive (near-definitional once extracted); `anchor` = the name-object.
  This is "how is it not one function" — the one function is the argmin, never named as a cell.
- **Caught the sentence-slug:** `do-the-work-dont-tell-the-user` factors as
  `⊔{principal-agency, decision-yield, act-not-narrate-differentia}` — a composite wearing a descriptive
  name → emit by reference + re-anchor. ("Multi-word is suspect," derived not asserted.)
- **Has teeth on the hard case:** surfaced (not auto-collapsed) whether `minimalism` shares a deeper
  no-surplus primitive with the fit-cluster — left to reader-relativity (where to stop fusing).

Verdict: the model classifies sensibly, catches every known false anchor, and yields an actionable
re-factorization without assertion. Cleared to land.

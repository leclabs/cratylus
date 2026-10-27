# Handoff

Read after the domain model in `design/model/`. This note says what is open and why the design is shaped as it is, so a settled choice is not reopened by accident. It is rewritten whole whenever it changes.

## Open

| Item                                     | Whose         | What would close it                                                                                                                                                                                              |
| ---------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release of `develop` to `main`           | Product owner | The release; until then the orientation's link to the cratylic context design model on `main` resolves to nothing                                                                                                |
| A real session with the installed agents | Product owner | One real task run from `omp --agent business-analyst`, judging whether the tech lead and software engineers reason about the outcome or work through a checklist, and whether anything they should do is missing |
| Effort cannot be measured                | Tech lead     | The harness reports no token counts for agent runs, so an outcome's cost is an estimate; closed when token counts reach the outcome, or when the product owner rules effort out of the outcome                   |
| Forceful wording in `AGENTS.md`          | Product owner | Its emphatic lines (capitals, "absolutely mandatory") cut to plain statements of what to read, or kept by choice; current models over-apply forceful instructions                                                |

## Settled, with reasons

- **The domain model is plain files, one per concept, with version control as its history.** Each record must be readable on its own by a fresh session, so it states only current meaning. Git already keeps every earlier version and the reason for each change, and a merge conflict already shows two meanings that compete; a dedicated event log would rebuild that on top of git.
- **The practice is behaviour-driven development.** Its essence is the whole loop cratylus needs: a shared vocabulary from the domain model, examples agreed before the build, acceptance tests written from them first, and acceptance only when they pass. Domain-driven design contributes only its ubiquitous language and its bounded contexts; the rest of its ceremony costs more than it gives here. No tool or syntax is implied.
- **The agents carry the industry role names.** Each name already tells a model what the role owns: the business analyst holds meaning and never decides how anything is built; the test engineer writes the acceptance tests before the build and gives the verdict, so no software engineer grades its own work; the tech lead organizes and joins the realization. A name a model reads otherwise (an architect reads as the technical designer) gives the agent the wrong job.
- **Examples belong to concepts, not to user stories.** An example lives as long as its concept and is bound to its acceptance test by name, so the model check can tell when a test or an example is left without its partner.
- **Corrections and profiles state only departures.** What a term already carries is never restated; restating an established practice as rules makes an agent follow a script instead of applying the practice by judgment.
- **A practice reaches an agent by its name alone.** A model already knows an established practice such as behaviour-driven development, so nothing shipped explains it; explained, it reads as a script. Cratylus ships only its departures from a practice, as rules, and only where it has any: behaviour-driven development has one, where examples live and how their tests are titled. Cratylic context design is not known by its name, so its know-how is carried by skills.
- **Decisions of realization live apart from the model**, in `design/decisions/`, because how cratylus is built is never part of what it means.

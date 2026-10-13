# Examples · reach repair

Context: agents. Concepts: reach. Decisions in force: 0068 and 0140.
A repair cut: its one example is agents/7 of the reconstitution cut, carried unchanged, whose check
fails on dev.

## Structural (assertions over delivered output)

1. (reach) **Given** the harness offers its default tools and no harmful use has justified narrowing
   an agent's tools, **when** each delivered role is started, **then** it receives those default tools,
   including the shell and the journal's appending operations where the harness offers them; neither
   a read-only assayer list nor an assayer-specific journal gate withholds them.

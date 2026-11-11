# install

At user scope by default, or project scope; places every agent and skill, and offers the rulesets, each taken whole or rule by rule; a recorded rule no longer offered is dropped and named; each tier's model stays the product owner's setting, a user installation naming each tier left unbound

## Examples

### installs the industry roles

Given cratylus's agents
When install runs at user scope
Then the harness offers exactly business-analyst, tech-lead, software-engineer, test-engineer and code-reviewer, and the personas mav, nico and kino

### installs every agent and skill unattended

Given no terminal
When install runs at user scope naming only the harness
Then it installs every agent and skill and completes

### offers a ruleset added since the recorded choice

Given an installation whose recorded choice predates a ruleset now offered
When install runs again on a terminal without --rules
Then it keeps the recorded choice and asks only about the newly offered rules
And without a terminal it keeps the recorded choice and names the rules it did not offer

### offers clean-cutover in place of green-field

Given cratylus's rulesets
When install offers them
Then it offers the clean-cutover ruleset, holding only the clean-cutover rule
And it offers no green-field rule

### drops a recorded rule no longer offered

Given an installation whose recorded choice names green-field-declared-constraints
When install runs again
Then it drops that rule and names it as no longer offered
And it asks about clean-cutover as a newly offered rule

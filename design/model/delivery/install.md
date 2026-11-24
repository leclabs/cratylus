# install

At user scope by default, or project scope; places every agent, and offers the rulesets, each taken whole or rule by rule; a recorded rule no longer offered is dropped and named, and a skill an earlier installation placed is removed and named; each tier's model stays the product owner's setting, a user installation naming each tier left unbound

## Examples

### installs the industry roles

Given cratylus's agents
When install runs at user scope
Then the harness offers exactly business-analyst, tech-lead, software-engineer, test-engineer and code-reviewer, and the personas mav, nico and kino

### installs every agent unattended

Given no terminal
When install runs at user scope naming only the harness
Then it installs every agent and completes

### removes a skill an earlier installation placed

Given an installation whose earlier version placed cratylus's skills
When install runs again
Then it removes each of those skills and names it as no longer installed

### offers a ruleset added since the recorded choice

Given an installation whose recorded choice predates a ruleset now offered
When install runs again on a terminal without --rules
Then it keeps the recorded choice and asks only about the newly offered rules
And without a terminal it keeps the recorded choice and names the rules it did not offer

### offers green-field and clean-cutover apart

Given cratylus's rulesets
When install offers them
Then green-field and clean-cutover are rulesets of one rule each

### drops a recorded rule no longer offered

Given an installation whose recorded choice names green-field-declared-constraints
When install runs again
Then it drops that rule and names it as no longer offered
And it asks about green-field and clean-cutover as newly offered rules

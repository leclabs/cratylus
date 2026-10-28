# install

At user scope by default, or project scope; places every agent and skill, and offers the rulesets, each taken whole or rule by rule; each tier's model stays the product owner's setting, a user installation naming each tier left unbound

## Examples

### installs the industry roles

Given cratylus's agents
When install runs at user scope
Then the harness offers exactly business-analyst, tech-lead, software-engineer, test-engineer and code-reviewer, and the personas mav, nico and kino

### installs every agent and skill unattended

Given no terminal
When install runs at user scope naming only the harness
Then it installs every agent and skill and completes

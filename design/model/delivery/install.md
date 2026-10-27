# install

Per agent harness at one installation scope: user, across every project, by default, or project, inside one project and shared through it; idempotent; within a project its project installation takes precedence over the user's; installs every agent and skill cratylus ships, with the rules its agents' practice departs by, and offers its other rulesets, each taken whole, rule by rule or not at all; asks only what it isn't told, never choosing a tier's model in the product owner's place; each person's own settings, a tier's model and how the session shows its agent included, are written only by a user installation, which names each tier left unbound as the next step; a project installation writes none of them

## Examples

### installs the industry roles

Given cratylus's agents
When install runs at user scope
Then the harness offers exactly business-analyst, tech-lead, software-engineer, test-engineer and code-reviewer, and the personas mav, nico and kino

### asks nothing about practices

Given no terminal
When install runs at user scope naming only the harness
Then it installs every agent and skill without asking which to take
And it never refuses for want of a choice of practices

### installs the practice's rules with the agents

Given no terminal and no rules named
When install runs at user scope
Then the behaviour-driven-development ruleset is installed
And no other ruleset is

# integration branch

Where finished work joins before release: under gitflow, develop unless the project's AGENTS.md names another, and without gitflow the repository's default branch. Where gitflow is taken and the branch neither exists nor is named, an agent that needs it stops, and the product owner is asked through the main session

## Examples

### gitflow integrates into develop unless the project names another

Given cratylus's rulesets
When install offers the gitflow ruleset
Then its rules name the integration branch develop unless the project's AGENTS.md names another

### the tech lead integrates into the branch the project names (judged in review)

Given the gitflow ruleset taken and a project whose AGENTS.md names its integration branch trunk
When the tech lead merges a finished feature
Then the feature branched from trunk and merges into trunk

### a missing integration branch is asked of the product owner (judged in review)

Given the gitflow ruleset taken, no develop branch and no other integration branch named in the project's AGENTS.md
When an agent needs the integration branch
Then it stops and its dispatcher hands the question up to the main session
And the main session asks the product owner which branch integrates

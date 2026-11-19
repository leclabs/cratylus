# realization

How a user story, or a task with no story, is built: its code and every test of it, joined into develop as one merge naming its story, or its task where there is no story; develop's merges are the record of what is built. Each concept has one realization. A concept the story modifies, some of its meaning carrying over, has its realization changed; a concept the story replaces, none of its earlier meaning carrying over whether or not its name is kept, has its realization replaced, the old one deleted whole, code, every test of it and their fixtures, in the same change, and the new meaning's tests written from its examples. Which concepts a story replaces is a meaning decision, the business analyst's, named in the story; every other concept it touches is modified, and an agent finding that call misfit raises a meaning question

## Examples

### the tech lead remembers what is built

Given cratylus installed
When the tech lead's agent is read
Then its memory names the domain model and develop's first-parent merge commits

### a story names the concepts it replaces

Given cratylus installed
When the tech lead's assignment form for a user story is read
Then it carries the concepts the story replaces, each as context and concept
And a story replacing no concept carries none

### a task names the realization it touches

Given cratylus installed
When the software engineer's assignment form is read
Then it carries, where the task touches a realized concept, each merge commit that realized it, by short sha and header, marked replace where its story replaces the concept and change otherwise
And a task touching no realized concept carries none

### a merge records its story (judged in review)

Given a finished user story on its feature branch, named for the story
When it is merged into develop
Then the merge summarises for an agent reader what the story built and names the story
And a task with no story, merged so, names the task

### a modified concept keeps what still holds (judged in review)

Given a user story that adds or amends a concept's examples and does not name it replaced
When its realization is merged
Then the concept's realization is changed, not rebuilt
And the tests of its examples that still hold remain

### a replaced concept leaves no realization (judged in review)

Given a user story naming a concept it replaces
When its realization is merged
Then no code, test or fixture of the replaced concept remains
And the new meaning's tests are written from its examples

### one realization per concept (judged in review)

Given a change touching a concept
When the code reviewer reviews it
Then it approves only where the concept has exactly one realization after the change

# realization

How a user story, or a task with no story, is built: its code and every test of it. An example's realization is reached through its one acceptance test, which names it; that binding, not history, is the record of what is realized. Each concept has one realization. A concept the story modifies, some of its meaning carrying over, has its realization changed; a concept the story replaces, none of its earlier meaning carrying over whether or not its name is kept, has its realization replaced: its examples leave the domain model, its code, every test of it and their fixtures are deleted whole in the same change, and the new meaning's tests are written from its examples; a task with no story replaces none. Which concepts a story replaces is a meaning decision, the business analyst's, named in the story and carried to its tasks; every other concept it touches is modified, and an agent finding that call misfit raises a meaning question

## Examples

### a story names the concepts it replaces

Given cratylus installed
When the tech lead's assignment form for a user story is read
Then it carries the concepts the story replaces, each as context and concept
And a story replacing no concept carries none

### a task carries what its story replaces

Given cratylus installed
When the software engineer's assignment form is read
Then it carries the concepts the task's story replaces, where the story replaces any
And its only required fields are the task, its goal, what it changes and what done means

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

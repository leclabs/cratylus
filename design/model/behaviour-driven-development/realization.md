# realization

How a user story, or a task with no story, is built: its code and every test of it, joined into develop as one merge commit whose header summarises for an agent reader what it built and whose trailer names the story, or the task where there is no story; develop's first-parent merges are the record of what is built. Where a meaning holds, its realization is changed; where a meaning changed, its realization is replaced, the old one deleted whole, code, every test of it and their fixtures, in the same change, and the new meaning's tests written from its examples; each concept has one realization

## Examples

### the tech lead remembers what is built

Given cratylus installed
When the tech lead's agent is read
Then its memory names the domain model and develop's first-parent merge commits

### a task names the realization it touches

Given cratylus installed
When the software engineer's assignment form is read
Then it carries, where the task touches a realized concept, each merge commit that realized it, by short sha and header, marked change or replace
And a task touching no realized concept carries none

### a merge records its story (judged in review)

Given a finished user story on its feature branch, named for the story
When it is merged into develop
Then the merge commit's header summarises for an agent reader what the story built
And its trailer names the story
And a task with no story, merged so, has a trailer naming the task

### a replaced meaning leaves no realization (judged in review)

Given a user story that changes a concept's meaning
When its realization is merged
Then no code, test or fixture of the replaced meaning remains
And the new meaning's tests are written from its examples

### one realization per concept (judged in review)

Given a change touching a concept
When the code reviewer reviews it
Then it approves only where the concept has exactly one realization after the change

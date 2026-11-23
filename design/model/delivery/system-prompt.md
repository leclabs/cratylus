# system prompt

The one the installed harness builds each turn, opened by the agent's definition; the passages cratylus judged contrary to the persona or bloat removed, every other passage kept, a newer harness's included; a judged passage the installed harness no longer holds named at session start; dumped to a file the product owner names

## Examples

### a launched agent's system prompt

Given cratylus installed
When an agent launches with --agent
Then its system prompt is the agent's definition, then the harness's prompt without the passages cratylus removes

### a dispatched agent's system prompt

Given cratylus installed
When an agent dispatches another
Then the dispatched agent's system prompt is its definition, then the harness's prompt without the passages cratylus removes

### keeps what a newer harness adds

Given a harness release whose prompt has a section cratylus has not judged
When an agent launches
Then its system prompt keeps that section

### dumps the system prompt to a file

Given cratylus installed
When a session run with --dump-system-prompt <file> starts a turn
Then the file holds the system prompt that turn carries, its blocks marked apart

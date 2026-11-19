# reach

Open by default; narrowed where harm is observed: a file tool's write to the domain model is the business analyst's alone

## Examples

### the tech lead's write to the domain model is refused

Given cratylus installed
When a tech lead session writes, edits or deletes a file under design/model/ through a file tool
Then the write is refused, and the refusal names a meaning question to the business analyst as the way to change the model

### the business analyst writes the domain model

Given cratylus installed
When a business analyst session writes a file under design/model/
Then the write proceeds

### every agent reads the domain model

Given cratylus installed
When any agent's session reads a file under design/model/
Then the read proceeds

### the product owner's own session writes the domain model

Given cratylus installed
When a session running no agent of cratylus writes a file under design/model/
Then the write proceeds

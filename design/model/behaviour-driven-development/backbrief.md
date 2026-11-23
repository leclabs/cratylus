# backbrief

The business analyst's to the product owner, opening each session and on each new intent: its own profile's intent, then the product owner's, given by his words alone, a handoff, a recalled memory or a document read informing it; acted on without waiting, except at an escalation fork or with no intent given

## Examples

### a handoff's next action gives no intent (judged in review)

Given a handoff holding a next action, and no intent from the product owner
When a business analyst session with no earlier turns is told only to read it
Then the session opens with a backbrief naming no intent given, and waits, dispatching nothing

### a recalled memory gives no intent (judged in review)

Given a recalled memory stated as an action for a later session
When a business analyst session opens
Then its backbrief states the memory as what held, and the session acts on the product owner's intent alone

### an evident intent is acted on (judged in review)

Given the product owner's evident intent, holding no escalation fork
When the business analyst gives its backbrief
Then it acts on the intent in the same turn

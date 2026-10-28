# model check

Deterministic, in the project's one check: binds each example to the acceptance test titled by it, or to code review where marked judged in review; warns of implementation leakage in a record and of prohibition in a precising definition

## Examples

### an example with no acceptance test fails

Given a concept with an example no acceptance test names and not marked judged in review
When the model check runs
Then it fails, naming the concept and the example

### a test naming a missing example fails

Given an acceptance test naming an example the domain model does not have
When the model check runs
Then it fails, naming the test and the missing example

### an example judged in review needs no test

Given a concept whose only example is marked judged in review
When the model check runs
Then it passes for that concept

### history in a record is warned of

Given a concept whose precising definition recounts what the concept used to mean
When the model check runs
Then it warns, naming the concept and the words, and passes for them

### a prohibition in a record is warned of

Given a concept whose precising definition states what the concept is not
When the model check runs
Then it warns, naming the concept and the words, and passes for them

# model check

Deterministic, in the project's one check: each record in its form, each example bound to the acceptance test titled by its context, concept and name, in whatever language and test framework the project tests in, or to code review where marked judged in review

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

### binds an acceptance test in any language

Given an acceptance test titled by its context, concept and example name, written in any language and test framework the project tests in
When the model check runs
Then it binds the example to that test

### a title quoted outside a test binds nothing

Given an example's title quoted in documentation, a changelog or a test's comment
When the model check runs
Then the quotation binds no example

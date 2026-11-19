# model check

Deterministic, in the project's one check: each record in its form, each example bound to the acceptance test, in any language, titled by its context, concept and name, or to code review where marked judged in review

## Examples

### an example with no acceptance test fails

Given a concept with an example no acceptance test names and not marked judged in review
When the model check runs
Then it fails, naming the concept and the example

### a test naming a missing example fails

Given an acceptance test naming an example the domain model does not have
When the model check runs
Then it fails, naming the test and the missing example

### an example two tests name fails

Given an example two acceptance tests name
When the model check runs
Then it fails, naming the example and both tests

### an example judged in review needs no test

Given a concept whose only example is marked judged in review
When the model check runs
Then it passes for that concept

### binds tests in any language, and only tests

Given an example's acceptance test in any language, and its title quoted in a changelog
When the model check runs
Then the test alone binds the example

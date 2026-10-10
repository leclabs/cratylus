# Judgment set · cut 2a · workflow execution

Same run rule as the visible examples.

1. (lead) **Given** a builder asks which of two approaches to take and both keep the concept, **when** the
   lead receives the question, **then** it decides and directs the builder itself, and never takes it to the
   architect.
2. (builder) **Given** a failing case seems to need a change to another work package's output, **when** the
   builder responds, **then** it changes neither that output nor the example, and reports to the lead.
3. (judgment) **Given** judgment finds that an example no longer expresses its concept, **when** the lead
   records it, **then** it sends a meaning question to the architect and never hands it to builders.
4. (assayer) **Given** the build is green but one case cannot execute, **when** the assayer judges,
   **then** it reports the case as a finding and repairs nothing.
5. (work package) **Given** a work package declared to serve two concepts, **when** its builder is given its
   examples, **then** it receives every visible example of both concepts, and none of any other concept.

Moved to the execution bookkeeping cut (decision 0015): cases 2, 5 and 7, to be rewritten there as
structural cases. Numbers retired.

# Examples · leakage precision

Context: workflow. Concept: implementation leakage. Decision in force: 0058. Confirmed by the architect on
2026-10-10 under the operator's delegation. All structural: record entries, run the leakage inspection.

1. **Given** a context whose subject does not name a tool, **when** a decision recorded as constraining
   realization names that tool, **then** it raises no leakage warning.
2. **Given** the same context, **when** a decision recorded as stating meaning names the same tool, **then** it
   is warned, and stays recorded.
3. **Given** a context whose subject names a tool, **when** a concept in it names that tool, **then** no warning;
   **and when** the same concept is recorded in a context whose subject does not name it, **then** it is warned.
4. **Given** a decision recorded without saying which kind it is, **when** it is inspected, **then** it is
   treated as stating meaning and warned for naming a tool.
5. **Given** a decision recorded before kinds existed, **when** its kind is recorded afterwards, as an entry of
   its own that leaves the decision's record unchanged, **then** it is inspected as that kind from then on.

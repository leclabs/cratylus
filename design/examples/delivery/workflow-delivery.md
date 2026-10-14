# Examples · workflow delivery

Context: delivery. Concepts: delivered context.

1. (delivered context) **Given** cratylus's workflow context has a current subject, a current relation and live concepts, including a concept whose earlier wording was superseded, and its journal also contains a retired concept and decisions, **when** a release projects that context, **then** the delivered design contains the current subject, relation and every live concept with its current meaning and dependencies, equal to that release's source design. It contains neither the earlier wording, the retired concept, the journal's history nor its decisions; it is not a separately authored summary of the practice.

2. (delivered context) **Given** a release containing that projection, **when** cratylus is installed for a user, **then** the delivered workflow context is placed read-only under the owned root alongside the delivered agents. It carries cratylus as its origin, the release version and the identity of the workflow context from the source journal. It is available across that user's projects, not installed as a context owned by whichever project happened to be open during installation.

3. (delivered context) **Given** an installation from release A and a project with its own booking context, **when** release B is installed with a changed workflow design, **then** the delivered context is replaced by B's projection and identifies B as its version. The project's booking design and journal are unchanged; no A wording remains mixed into B's delivered design, and no delivered entries are appended to the project as part of the upgrade.

4. (delivered context) **Given** the same release source design and release version are projected twice, **when** the two delivered contexts are read, **then** their design and provenance are the same. If cratylus's development journal changes afterwards without a new release being installed, neither installed projection changes to that later design or claims its meaning under the earlier version.

5. (delivered context) **Given** an installation supplies the workflow context and a project separately owns a booking context, **when** cratylus is uninstalled, **then** the delivered context leaves with the owned root and the project's booking journal remains unchanged. No copy of the delivered workflow design remains in the project's journal as residue of installation or earlier reads.

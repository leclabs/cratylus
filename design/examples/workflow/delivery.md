# Examples · delivery · older journal reader

Context: workflow. Concept: concept journal. Decisions in force: 0108 (delivery cut) and 0109 (an older
reader reads past what it does not know).

**Structural** examples assert on the views computed by an older reader, its reports, and the journal
before and after an append, deterministically. Every example states what must hold and what must not
happen.

## Structural

1. (concept journal) **Given** a journal records a reservation concept meaning ten minutes, then an entry
   of a newer kind the reader does not know, then a known supersession changing the concept to fifteen
   minutes with its reason, **when** the older reader is asked for the current design and the concept's
   history, **then** the design shows fifteen minutes and the history shows both known versions in order
   with their reasons, and both views report the unknown kind, one uninterpreted entry and that the view
   may be incomplete; the reader never refuses the journal, stops at the unknown entry, invents its
   meaning or presents ten minutes as the latest known version.
2. (concept journal) **Given** a journal contains two entries of a newer kind called annotation and one
   of a newer kind called review, neither understood by the reader, interspersed with readable context
   descriptions, concepts and decisions, **when** each journal view is requested, **then** it computes the
   known entries as usual and accompanies its answer with the unknown kinds annotation and review, their
   counts of two and one, and the warning that its view may be incomplete; this holds for the context
   overview, whole state, current design, concept history, context history, decisions and leakage views,
   including a view requested again. No view silently drops that warning, counts only the first unknown
   entry, or refuses the whole journal because of those entries.
3. (concept journal) **Given** an older reader can read a recorded context but cannot interpret a newer
   kind of entry elsewhere in its journal, **when** a new concept with valid wording and a reason is
   recorded in that context through the older reader, **then** it appends the concept, its next design
   view includes that concept and still reports the uninterpreted entries, and every pre-existing entry
   remains exactly as recorded; it never forbids the append merely because an entry kind is unknown,
   removes unknown entries, rewrites them into a kind it knows or changes the earlier design records.
4. (concept journal) **Given** a journal contains an unknown entry kind and a separate entry of the known
   kind for defining a concept whose required wording is missing, **when** the older reader attempts to
   read the journal, **then** it refuses the unreadable known entry and identifies that entry in its
   refusal; it never treats the malformed known entry as another unknown kind, silently skips it or
   presents a successful partial view as though only the unknown kind were at issue.
5. (concept journal) **Given** a journal contains only kinds the reader knows, with valid context changes,
   a concept's supersession and a decision's acceptance, **when** its design, histories and decisions are
   requested, **then** the usual current meanings, ordered histories and accepted decision are returned
   without an unknown-kind warning; the reader never labels understood entries as uninterpreted, claims
   its view is incomplete because of an unknown kind that is not present, or appends anything while reading.

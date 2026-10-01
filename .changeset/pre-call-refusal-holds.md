---
"@cratylus/canon": patch
---

The pre-call stance guard no longer lets a refused call through when it is retried. It kept a marker per session and tool input and waved an identical second call through unjudged under a re-entry cap, so a refusal held once and then lapsed. Now every call is judged, a repeat of a refused call included, and a block on it denies it again however often it comes; the worker writes no marker. The worker header and the cell's residue state this as the retry law where the cap was. The rubric, the payload, the scope gate, the subagent skip and the fail-open notices are unchanged, and the turn-end guard is untouched.

---
"cratylus": minor
---

`cratylus memory` is gone

The command no longer bundles the memory capability, so `cratylus memory`
and every verb under it now refuse instead of running. Nothing is migrated:
no verb of this command reads or writes a memory store any more, and a store
already on disk is left where it is.

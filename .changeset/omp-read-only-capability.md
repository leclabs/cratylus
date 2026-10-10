---
'@cratylus/forge': patch
---

The cratylus omp extension now offers an agent that changes nothing only the reading verbs of each capability. A main session started with `omp --agent` and a session omp dispatches both run as their declaration. When that declaration lists its tools and each one is a reading or searching tool (the `tools:` list install writes for a read-only agent), its `concept_journal` offers only the verbs that read. A capability with no reading verb is not offered at all, and a withheld verb called anyway is refused before the command runs. Every other agent and plain session is still offered every verb. Each capability's tool is now registered when the session starts, once its agent is known. The installed command is still asked for each capability's explanation when the extension loads.

---
"cratylus": patch
"@cratylus/runtime": patch
---

Renaming now holds on joined lines of work and through a close (decision 0322):

- A concept is the versions of one context joined by supersession or a shared name, whatever order they were recorded in.
- Competing versions that all give the concept one name are listed under that name, and a close opens each of them under it, so a rename made alike on both lines is never reversed. Competing versions that name the concept differently are listed under the name of the latest version they all supersede, else under the concept's earliest version's name.
- `close` is refused, changing nothing, while a concept's competing versions name it differently, and it opens every concept under its current name alone.
- The explanation names each concept by its term, and the docs say what close and design do with a renamed concept.

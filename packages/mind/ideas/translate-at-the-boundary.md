---
kind: principle
delineation: When adapting user logic to a foreign host, translate only at the shape boundary — where the event fires, what payload arrives — and wrap the original with a thin shim; never rewrite the body of the user's logic itself.
---

# Translate at the Boundary

The **boundary** is _what fires this and what data arrives on stdin_; the **body** is _what the user's code does_. The shim adapts the seam to the host's expected shape (plugin object, payload JSON) and shells out to the original, which stays verbatim.

This is the Unix-pipe discipline: adapt connectors, preserve the program.

## See also

- [[lossless-floor]] — the shim preserves the body exactly; only the seam shape is adapted.
- [[minimalism]] — emit the thinnest shim that bridges the seam, nothing more.

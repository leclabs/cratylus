---
kind: principle
delineation: When adapting user logic to a foreign host, translate only at the shape boundary — where the event fires, what payload arrives — and wrap the original with a thin shim; never rewrite the body of the user's logic itself.
---

# Translate at the Boundary

When carrying a user's executable logic into a foreign host that expects a different shape, translate **only at the boundary** — the interface seam where the trigger fires and the payload arrives — and leave the **body untouched**. The user wrote a shell command; it stays a shell command. Where the host wants a plugin object or a different payload JSON, emit a **thin shim** that adapts the seam and shells out to the original.

The boundary is _what fires this and what data shows up on stdin_; the body is _what the user's code does_. Translation belongs at the former and is forbidden at the latter. Rewriting the body would mean re-authoring (and silently changing the behavior of) logic you do not own — the host's quirks must be absorbed by a wrapper, not pushed into the user's code.

This is the Unix-pipe discipline: adapt connectors, preserve the program. A shim at the seam is auditable and reversible; a rewritten body is a lossy fork of the user's intent.

## See also

- [[lossless-floor]] — the shim preserves the body exactly; only the seam shape is adapted.
- [[minimalism]] — emit the thinnest shim that bridges the seam, nothing more.

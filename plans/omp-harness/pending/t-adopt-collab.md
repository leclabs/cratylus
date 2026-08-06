# t-adopt-collab

**Wave 2.** `/collab` replaces `provisional-mailbox`.

## Intent

`provisional-mailbox`'s stated intention is peer collaboration between main agents. omp ships
it: `/collab` hosts a shared session over a relay (`collab.relayUrl = wss://my.omp.sh`), and
`omp join <link>` joins one. The link carries a key in its fragment.

This corpus already has the primitive it built for that purpose and never wired to anything —
an `EnvelopeStore` with atomic claim, and no consumer. Adopting `/collab` means the mailbox
either becomes the offline/other-harness path or is deleted.

## What must be established before adopting

- **What is the trust model?** The link's fragment carries a key, and the mailbox port
  carries a standing warning that an inbound body reaches a model's context verbatim and is a
  prompt-injection surface. A relay-delivered peer message is the same surface with a longer
  reach. Whatever `/collab` does about provenance and trust must be understood, not assumed.
- **Whose relay?** `wss://my.omp.sh` is not run by this corpus. For a fleet that is six hosts
  on one LAN, a public relay may be the wrong dependency — or exactly the right one, since the
  alternative is SSH plumbing nobody maintains. Decide, with the reason recorded.
- **Is a collab session a CHANNEL or a shared CONTEXT?** Those are different concepts and the
  mailbox is the former. If `/collab` shares a session rather than passing messages, it does
  not replace the mailbox and this shard's premise is wrong — say so.

## Deps

`t-omp-persona-bootstrap`

## Accept

1. Two cratylus agents collaborate as peers through `/collab`, demonstrated rather than
   described.
2. A ruling on `provisional-mailbox`: adopted-and-deleted, kept as the non-omp path, or kept
   because `/collab` turned out to be a different concept.
3. The trust question is answered in writing before any inbound body reaches a model.

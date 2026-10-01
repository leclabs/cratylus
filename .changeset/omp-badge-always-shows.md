---
'@cratylus/forge': patch
'cratylus': patch
---

The persona badge on omp no longer throws at launch on an omp before 18.3.2, which has no `ctx.agent`: it shows the badge where omp's `ctx.mode` still says the session is the interactive terminal host, and where nothing can tell, it says once, in one line, why it shows none. Where the host's `statusLine` is an alias to a mapping written elsewhere and that mapping hides the status row (`showHookStatus: false`) with no `status` segment listed, the badge, which used to show nowhere, is also set in a widget beneath the editor; where the row is shown or `status` is listed it still appears once, in the status line. A subagent's session still gets no badge on any surface.

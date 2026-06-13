"""Place stage -- write rendered artifacts to a scope's `.claude/` root and seed
an agent's self-authored sidecar layers if-absent.

Scope is an accident ([[scope-grant]] / [[substance-over-accident]]): the SAME
rendered artifact lands at user / project / fleet / local scope unchanged; only
the root resolver + execution backend (local fs vs ssh) differ. Backends:
place.local (filesystem) and place.ssh (remote). Scope roots: place.scope.
"""

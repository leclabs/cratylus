# 0021 · Owned root

Status: accepted · 2026-10-09

## Context

Cratylus placed files across many of a host's harness surfaces. Removing or replacing an installation meant
finding what it had placed file by file, and earlier installations left residue that later sessions mistook for
current law.

## Decision

Everything cratylus places on a host lives under **one root it owns**; the harness's own surfaces only refer
into it. An **upgrade** replaces the owned root whole and rewrites the references, leaving exactly what the new
version places and everything the host owns.

## Consequences

What cratylus placed is known by construction. Realized in the delivery cut, which also retires the event tap.

# Cratylus

Cratylus puts a set of named agents and skills on your machine for Claude Code or omp. Each
agent is projected from a corpus of meanings whose names were discovered in the model's own
vocabulary rather than written as prose, so the same corpus renders the same way every time. You
install it with one command and start an agent by its name. The idea behind it, on one page and in
plain terms, is in [INTRODUCTION.md](./INTRODUCTION.md); the thesis is in [VISION.md](./VISION.md).

## Install and use

You need Node 22 or later, and Claude Code or omp run at least once on this machine.

1. Install the command:

   ```sh
   npm install -g cratylus
   ```

2. Put the agents on this machine:

   ```sh
   cratylus install
   ```

   The run is guided. It asks only what you have not said: which harness, which practices (the ways
   of working it offers, each installed as one choice), and which model each agent falls back to.
   It shows what it will place, and places it once you confirm. Everything lands under one root
   cratylus owns, `~/.cratylus/omp/`, which omp loads in every project; omp's own files are only
   pointed at it, never overwritten.

3. Start a session as an installed agent, through the harness itself:

   ```sh
   omp --agent mav
   ```

   Any other word on the command line is the harness's own flag.

4. Upgrade by installing again with the new cratylus: `npm install -g cratylus`, then
   `cratylus install`. The root is replaced whole, and an installation from before the owned root
   is taken back. When the installed artifacts and the `cratylus` command differ, every omp session
   start warns, naming both versions (`cratylus versionSkew report` shows them).

5. Take it away again, whenever you like:

   ```sh
   cratylus uninstall --harness omp
   ```

   It removes the owned root and every reference into it, and leaves whatever the host placed or
   changed.

The questions and their flags, what a refusal says, the model routing, version skew and what
uninstall leaves are all in [packages/cli/README.md](./packages/cli/README.md).

## Where to go from here

- To write a corpus of your own, read the package that owns each concern:
  [packages/forge/README.md](./packages/forge/README.md) for projecting a corpus onto a harness,
  [packages/schema/README.md](./packages/schema/README.md) for the shapes a corpus authors against,
  [packages/canon/README.md](./packages/canon/README.md) for the corpus that ships, and
  [packages/runtime/README.md](./packages/runtime/README.md) for the capabilities the agents call.
- To change cratylus itself, start with [ARCHITECTURE.md](./ARCHITECTURE.md), which maps the packages
  and the seams between them, then the ground documents in the order they build: [VISION.md](./VISION.md)
  (why), [MODEL.md](./MODEL.md) (what exists), [ENGINE.md](./ENGINE.md) (how anchors are discovered,
  validated and projected) and [CANON.md](./CANON.md) (the corpus itself). [AGENTS.md](./AGENTS.md)
  lists what to read at the start of a session and the working conventions of the repository.

## License

MIT — see [LICENSE](./LICENSE).

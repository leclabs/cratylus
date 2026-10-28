# Cratylus

Cratylus installs the industry roles of behaviour-driven development — business analyst, tech lead,
software engineer, test engineer and code reviewer — with their skills into omp, the coding-agent
harness, each defined in the terms the model already understands. The idea behind it, on one page, is in
**[INTRODUCTION.md](./INTRODUCTION.md)**.

## Install and use

You need Node 22 or later, and omp run at least once on this machine.

```sh
npm install -g cratylus      # the command
cratylus install             # put the agents on this machine
omp --agent business-analyst # start here: the business analyst
```

`cratylus` with no arguments prints how to start, and `cratylus --help` lists everything else.

`cratylus install` installs every agent and skill cratylus ships, and asks only what you have not
said: which harness, which rules your agents follow in every project (rulesets such as
`behaviour-driven-development`, `gitflow`, `conventional-commits`, `commit-discipline`,
`established-libraries`, `green-field`), and which
model each agent falls back to. It shows what it will place and places it once you confirm, under
one root cratylus owns, `~/.cratylus/omp/`, which omp loads in every project.

**For one project**, run `cratylus install --scope project` inside it: the root is
`<project>/.cratylus/omp/`, omp loads it in that project in place of yours, and committing
`.cratylus/omp` and `.omp/` shares it with your team. Upgrade and uninstall it from that project
with the same `--scope project`.

**Upgrade** by running `npm install -g cratylus` and then `cratylus install` again; the root is
replaced whole. Until you do, every omp session start warns that the installed agents and the
command differ.

**Uninstall** with `cratylus uninstall --harness omp`. It removes the owned root and every
reference into it, and leaves whatever omp placed or changed.

Every flag, refusal and default is in [packages/cli/README.md](./packages/cli/README.md).

## Contributing

Start with [INTRODUCTION.md](./INTRODUCTION.md) and the domain model in
[design/model](./design/model): one plain file per concept, in a directory per bounded context,
with version control as its history. Each example in it is bound to the acceptance test named
`<context>/<concept>: <example name>`, and `cratylus model check`, part of `pnpm check`, holds the
two together. [AGENTS.md](./AGENTS.md) holds the working conventions.

## License

MIT — see [LICENSE](./LICENSE).

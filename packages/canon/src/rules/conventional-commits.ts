import type { Ruleset } from '@cratylus/schema';

/** Conventional Commits 1.0.0, as published at conventionalcommits.org. */
export const conventionalCommits: Ruleset = {
  name: 'conventional-commits',
  description:
    'Conventional Commits 1.0.0: a typed, optionally scoped commit header, with breaking changes marked.',
  rules: [
    {
      name: 'conventional-commits-structure',
      description:
        'A commit message is a typed header, then an optional body and footers.',
      convention:
        'Structure every commit message as `<type>[optional scope]: <description>`, then optionally a body after one blank line, then optionally one or more footers after one blank line. The description follows the colon and space directly and summarises the change.',
      why: 'A structured history can be read by people and parsed by tools: changelogs and the next version number are derived from it.',
    },
    {
      name: 'conventional-commits-types',
      description:
        'feat adds a feature, fix patches a bug; other types are allowed.',
      convention:
        'Use the type `feat` for a commit that adds a feature (it correlates with a MINOR version) and `fix` for one that fixes a bug (it correlates with a PATCH version). Other types, such as `build`, `chore`, `ci`, `docs`, `style`, `refactor`, `perf` and `test`, describe changes that are neither.',
      why: 'The type says what kind of change a commit is, which is what decides how it affects the version and where it belongs in a changelog.',
    },
    {
      name: 'conventional-commits-scope',
      description: 'A scope names the section of the codebase, in parentheses.',
      convention:
        'A scope may follow the type: a noun in parentheses naming the section of the codebase the commit changes, such as `fix(parser):`.',
      why: 'It locates the change at a glance and lets history be filtered by area.',
    },
    {
      name: 'conventional-commits-breaking-changes',
      description: 'Mark a breaking change with ! or a BREAKING CHANGE footer.',
      convention:
        'Mark a commit that breaks the API with `!` immediately before the colon, `feat(api)!: …`, or with a footer `BREAKING CHANGE: <description>`, or both. Where `!` marks it and no `BREAKING CHANGE` footer is given, the commit description describes the breaking change. A breaking change correlates with a MAJOR version, whatever its type.',
      why: 'Consumers and release tooling learn from the commit itself that upgrading needs their attention.',
    },
    {
      name: 'conventional-commits-footers',
      description:
        'Footers are git trailers: a token, then ": " or " #", then a value.',
      convention:
        'Write each footer as a token, then `: ` or ` #`, then a value, in the manner of git trailers, such as `Reviewed-by: Z` or `Refs #133`. A token uses `-` in place of spaces; `BREAKING CHANGE` is the one token written with a space, and `BREAKING-CHANGE` means the same.',
      why: 'Footers in the git trailer form are parsed by git and by release tooling alike.',
    },
  ],
};

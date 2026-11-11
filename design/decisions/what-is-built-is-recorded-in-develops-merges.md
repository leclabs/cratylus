# What is built is recorded in develop's merges

The record of what is built (`behaviour-driven-development/realization`) is develop's first-parent history, `git log --first-parent develop`, and no file apart from it: a registry file is a second home for what git already holds, and drifts from it. Each `--no-ff` merge into develop has a conventional-commit header summarising for an agent reader what it built, and a trailer `Story: <name>`, or `Task: <name>` for a task with no story; its feature branch is named for the story. Merges made before this form are kept as they are.

The tech lead holds the record as memory beside the domain model, and gives a software engineer each merge its task touches in the task's `realizedBy`, by short sha and header, marked `change` or `replace` from the story's examples; the engineer opens it with `git show <sha> --stat` and follows its paths at HEAD.

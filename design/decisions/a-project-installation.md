# A project installation

1. `install` and `uninstall` take `--scope user|project`, user by default; on a terminal, install asks for the scope it is not told, user preselected, wherever the project resolved from the working directory is not the home; `--yes` or no terminal takes user.
2. The project is the one omp anchors its plugins at from the working directory: the nearest ancestor holding `.omp/` other than the home, else the nearest holding `.git`, else the working directory. Project scope is refused where that is the home.
3. A project's owned root is `<project>/.cratylus/<harness>`, laid out as the user's, and its installation record states its scope.
4. Its references are in `<project>/.omp/plugins`, each relative: a link `node_modules/cratylus-omp` to the root, a relative `file:` dependency entry in that directory's `package.json`, and one `.gitignore` block, owned by its exact content, re-including that link.
5. A project install neither asks for nor writes any product owner's own setting, in the project or anywhere else: no model role and no status-line choice. `--model-roles` and `--agent-status` at project scope are each refused, naming the user scope. It reads, without writing, the project's and the user's settings, and names as the next step, to settle at user scope, each tier neither binds and, where those settings hide the session's agent, showing it.
6. A project install or uninstall writes nothing under the home.
7. The version skew warning and report name the scope and root, and the remedy names its scope.
8. The command, with no installation named, reads the nearest project installation above the working directory, else the user's.
9. Install refuses a project root over an earlier render tree.
10. A project uninstall also removes the project's `.omp/` directory where install created it and it is left empty.

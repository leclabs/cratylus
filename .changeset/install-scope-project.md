---
"cratylus": minor
"@cratylus/forge": minor
---

`cratylus install` and `cratylus uninstall` take `--scope user|project`. User, the default, is the installation you had. Project places everything inside the project you are in: the owned root at `<project>/.cratylus/omp`, and relative references in `<project>/.omp/plugins`: a link, a `file:` dependency, and a `.gitignore` block that keeps the link committable. The block is appended whole after your own lines, and uninstall takes back only the block. Commit them and your team shares the installation. In that project omp loads it in place of your user installation, and its session hooks run its own workers, which are named relative to the installation. A project install writes nothing under your home directory. It reads and writes model roles and the status-line choice in `<project>/.omp/config.yml`. On a terminal, install asks which scope you want when you are outside your home directory and gave no `--scope`, with user preselected. `installation.json` now records its `scope`. Install refuses to place a project root over an author's render tree, and `cratylus project` refuses to render into an installation.

# Examples · delivery

Context: delivery. Concepts: install, uninstall, owned root, upgrade, version skew and capability port.
Decisions in force: 0108 (delivery cut) and 0077 (version skew). The event tap is retired by 0108.
The operator's choices are covered by 0112 and 0113(1).

**Structural** examples assert on the installation, what the harness offers, and the results of the
operator's command and the harness's tools, deterministically. Every example states what must hold and
what must not happen.

## Structural

1. (install) **Given** Mira uses omp in two projects and another user has their own harness setup on the
   same host, **when** Mira installs cratylus once and starts omp in each project and in a third project
   created afterwards, **then** all three offer the installed corpus's agents, skills and adapters;
   installation is for Mira across projects, never something each project must repeat, and the other
   user's setup is unchanged.
2. (owned root, install) **Given** a host with no cratylus projection, **when** cratylus is installed for omp,
   **then** its projected agents, skills and adapters all live under one cratylus-owned root and the
   harness's own surfaces reach them only by references into that root; none of those surfaces holds a
   second copy of the projected material, and ownership is not inferred from individual contents or names.
3. (install, owned root) **Given** Mira's harness already has her own agent, skill, extension and settings
   outside the owned root, including an agent with a name also used by the corpus, **when** cratylus is
   installed, **then** those host-owned contents remain as they were alongside cratylus's references;
   installation never overwrites or removes host-owned material because its name resembles cratylus's.
4. (install) **Given** Mira has supplied every answer needed for installation, including omp as the
   harness, **when** installation runs, **then** it completes using those answers without asking any
   question; it never asks Mira to supply or confirm an answer already given.
5. (install) **Given** installation has already been told to use omp and Mira has answered a question it
   asked, **when** it continues, **then** any further question concerns only information still missing;
   it never asks for the harness again or repeats the question Mira answered.
6. (install) **Given** version 2.4.0 is installed and Mira has since changed her own harness settings
   outside the owned root without changing cratylus's references, **when** the same version is installed
   again with the same answers, **then** the owned root, its references, its recorded version and Mira's
   settings are unchanged; the repeat neither adds duplicate references nor restores old host settings.
7. (install, version skew) **Given** version 2.4.0 performs the projection while another build is also
   available on the host, **when** the installation's versions are requested through the harness's version
   tool, **then** the projected-artifact version is reported as 2.4.0 and the version of the command the
   capabilities actually reach is reported separately, with each identified by its role; the other
   available build never substitutes for the version that performed the projection.
8. (upgrade, owned root) **Given** an earlier installation contains an agent and a skill that the new
   version no longer delivers, **when** the new version is installed, **then** the owned root contains
   exactly the new version's projection and its recorded version, including its additions and changed
   material; the removed agent and skill do not survive, and old and new projections are never combined.
9. (upgrade, owned root) **Given** Mira has edited an installed skill and added her own material inside the
   owned root, and has also edited a host-owned skill outside it, **when** a newer version is installed,
   **then** the root is replaced whole: the installed skill has the new version's content and the added
   material is gone, while the outside skill keeps Mira's edit; upgrade neither preserves local changes
   inside cratylus's root nor discards changes outside it.
10. (upgrade, owned root) **Given** several harness surfaces refer into the earlier projection and also
    contain Mira's own references and settings, **when** a newer version changes what is projected,
    **then** every cratylus reference reaches the new projection and no reference remains to material it
    removed; Mira's own references and settings remain unchanged, and upgrade never replaces an entire
    host-owned surface with cratylus's preferred contents.
11. (uninstall, owned root) **Given** an installation whose root includes both projected material and a
    local addition, with references into it on several harness surfaces that Mira has also customized,
    **when** cratylus is uninstalled, **then** the whole root and every cratylus reference into it are gone,
    and Mira's customizations outside it remain; no installed agent, skill or adapter remains reachable
    through a stale reference, and no host-owned surface is removed just because it also served cratylus.
12. (uninstall, install) **Given** Mira uses one installation across two projects, each with its own
    conceptual design and work, and another user has a separate installation, **when** Mira uninstalls
    cratylus from her harness, **then** neither of her projects receives the removed projection and both
    retain their journals and work; the other user's installation is unchanged, and uninstall never treats
    project records or another user's installation as part of Mira's owned root.
13. (version skew) **Given** the projected artifacts were installed by 2.4.0 and their capabilities now
    reach command version 2.5.0 without a new install, **when** omp starts twice, **then** each startup
    immediately warns that the artifacts are 2.4.0 and the reached command is 2.5.0 and says to install
    again with the cratylus in use; the warning never waits for a capability call, is not suppressed after
    the first startup, and does not silently select another build or change the installation.
14. (version skew) **Given** the projected artifacts and the command their capabilities reach are both
    2.4.0, **when** omp starts and its version tool is queried, **then** startup gives no version-skew
    warning and the tool reports both roles as 2.4.0; a matching installation is never reported as skewed,
    and silence at startup does not make the versions unavailable on request.
15. (version skew, upgrade) **Given** artifacts projected by 2.4.0 and a command now at 2.5.0 have caused a
    startup warning, **when** Mira installs again with 2.5.0 and starts a new session, **then** the artifacts
    and command both report 2.5.0 and that session gives no skew warning; the old recorded version never
    survives the replacement, and resolving the mismatch requires no choice between builds.
16. (version skew, capability port) **Given** the installed command and artifacts are 2.4.0 and a project
    has its own pinned cratylus 2.6.0, **when** omp starts in that project and a capability is reached through
    its tool and through the installed command, **then** both use the installed command's 2.4.0 runtime
    and the version tool reports artifacts 2.4.0 and reached command 2.4.0; nothing redirects either route
    to 2.6.0 because the project pins it, and that unused version does not cause a skew warning.
17. (capability port, install) **Given** a host with cratylus installed for omp, no cratylus source workspace,
    and a project with a concept journal, **when** the operator records a concept through the command and
    reads it through the harness tool, then records its supersession through the tool and reads it through
    the command, **then** both routes see both changes and reach the same installed runtime; neither
    depends on the source workspace or maintains a separate account of the project's design.
18. (capability port) **Given** the installed runtime refuses to accept a decision that the project's
    journal does not contain, **when** that acceptance is requested through the command and through the
    harness tool, **then** both report the runtime's refusal with its reason and the journal is unchanged;
    the adapter never substitutes success, invents the missing decision or adds its own journal rules.
19. (retirement) **Given** the delivery cut's cratylus version, **when** what it delivers and a fresh
    installation are inspected, **then** the event tap is absent from the delivered capabilities, the
    projection and what the harness offers; it is never kept as an available but unadvertised capability
    or installed in a disabled form.
20. (retirement, upgrade) **Given** an earlier cratylus installation delivers the event tap and its harness
    references, **when** the delivery cut's version is installed over it, **then** the event tap and its
    cratylus-owned references are absent from the resulting installation; the earlier tap is never left
    reachable as a fallback, and retiring it does not remove unrelated host-owned extensions.
21. (install) **Given** Mira has supplied a model for each tier the installed agents use, a model choice
    for one persona's role, and her choice to show the session's agent on a status line that currently
    hides it, **when** installation runs, **then** it writes those answers as the host's own settings
    and the harness uses the chosen models and shows the session's agent; it never asks for those answers
    again, substitutes cratylus's preferred models or records any of those settings as cratylus-owned.
22. (install) **Given** the installed agents use two tiers, the host already binds the first to Mira's
    chosen model, the second has no binding or supplied answer, and the status line already shows the
    session's agent, **when** installation can ask Mira and she supplies the second tier's model,
    **then** it asks for that missing model and writes her answer as a host-owned binding, keeping the
    first tier's model and the status-line setting; it never asks her to choose the first tier's model
    again, asks about an agent display that is already shown, or chooses the missing model on her behalf.
23. (install) **Given** all model choices are settled but the host hides the session's agent on its
    status line and Mira has supplied no display choice, **when** installation asks and she chooses to
    show it, **then** the host's own setting records that answer and the session's agent is shown;
    installation never enables the display before receiving her answer, claims ownership of the setting
    or changes unrelated status-line choices.
24. (install) **Given** all model choices are settled but the host hides the session's agent on its
    status line and Mira has supplied no display choice, **when** installation asks and she chooses to
    keep it hidden, **then** installation completes with her answer retained as the host's own setting
    and the display stays hidden; it never overrides her refusal, treats that answer as a missing choice
    or tells her that she still needs to enable the display. The same holds when she supplies that
    answer before installation, without a question being asked.
25. (install) **Given** the installed agents use four tiers, one already has a host binding, Mira has
    supplied a model for a second, the remaining two have no answer, and the host hides the session's
    agent with no supplied display choice, **when** installation cannot ask questions, **then** it places
    the agents, skills and adapters, keeps the existing binding, writes the supplied one as the host's
    own, and names each of the two unbound tiers and the display choice as Mira's next steps; it never
    invents models or enables the display, names a settled choice as unbound, gives only an unnamed
    warning that setup is incomplete, or refuses to place everything else because answers are missing.
26. (install) **Given** installation recorded Mira's model choices and her choice to show the session's
    agent as host settings, and she later changes one model and hides the agent, **when** the same version
    is installed again with the original answers, **then** her current model bindings and hidden-display
    setting remain unchanged; installation never re-applies its earlier answers, reclaims those settings
    as its own or treats the host's changes as damage to repair.
27. (install, upgrade) **Given** an installation wrote two tier bindings, a persona's model choice and
    the agent-display choice as host settings, and Mira later changes one tier's model and the display
    choice but leaves the other answers untouched, **when** she upgrades, **then** the projection is
    replaced while all those host settings retain their current values, both edited and unedited;
    upgrade never removes an unedited answer because installation originally wrote it or resets an
    edited answer to what cratylus previously asked for.
28. (install, uninstall) **Given** installation wrote Mira's tier models, a persona's model choice and
    her agent-display choice as host settings, and she later changes one model, **when** she uninstalls,
    **then** the owned root and its references are removed while every one of those settings retains its
    current value; uninstall never deletes the answers it originally wrote, restores earlier values or
    removes the changed model along with cratylus's projection.
29. (install, upgrade) **Given** an earlier installation seeded tier and persona model bindings into the
    host's settings and recorded them as cratylus-owned, and Mira has changed one binding but left the
    others as seeded, **when** she upgrades to the delivery cut's version, **then** every binding keeps its
    current value and belongs to the host from then on, while the earlier cratylus-owned projection is
    removed and replaced; upgrade never deletes those bindings with the old installation, preserves only
    the edited binding or leaves the old projection in place to keep the bindings usable.

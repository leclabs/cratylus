# One owned root per installation scope

Each installation scope has one root that cratylus alone owns, holding all it places at that scope: the user's on the host, a project's inside the project; the harness's own surfaces only refer into it. Upgrade replaces the root whole and rewrites its references; uninstall removes exactly the root and every reference into it.

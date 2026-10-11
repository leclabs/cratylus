# Held-out · delivery

Used only in judgment.

## Structural

1. (version skew) **Given** the artifacts were projected by 3.1.0 but the command their capabilities reach
   has been replaced with 3.0.0, **when** omp starts, **then** it immediately reports artifact version 3.1.0
   and command version 3.0.0 and tells the operator to install again with the cratylus in use; a newer
   artifact version never escapes the skew warning merely because the command is older, and startup never
   switches to an available 3.1.0 build to hide the difference.
2. (upgrade, uninstall, owned root) **Given** Mira installs one version, then upgrades twice, with each
   upgrade removing some projected material and adding other material, while her own extension remains
   outside the owned root, **when** she uninstalls, **then** the owned root and all cratylus references are
   absent and her extension is unchanged; uninstall leaves no material or references from any of the
   three versions and never depends on remembering only what the most recent projection added.
3. (uninstall, owned root) **Given** one of the references cratylus placed has since been replaced by Mira
   with a reference to her own skill outside the owned root, while other references still point into the
   root, **when** cratylus is uninstalled, **then** Mira's replacement and its target remain unchanged,
   while the owned root and the references still pointing into it are gone; uninstall never deletes a
   host-owned replacement merely because cratylus originally used that place.
4. (version skew, capability port) **Given** a session began with artifacts and reached command both at
   2.4.0, and the command is then replaced by 2.5.0 without reinstalling the artifacts, **when** the session's
   version tool is asked for the versions and a capability is called, **then** the tool reports artifacts
   2.4.0 and reached command 2.5.0 and the capability reaches 2.5.0; the session never presents the command's
   startup version as its current version or keeps calling a private 2.4.0 implementation to preserve an
   apparent match.

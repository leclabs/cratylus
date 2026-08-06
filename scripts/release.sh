#!/usr/bin/env sh
# The publish path: packing belongs to pnpm, the audit to the gate, the upload to npm.
#
# NOT `changeset publish`. It delegates to `pnpm publish`, which runs `prepack` — so every
# package rebuilds at upload time and the bytes reaching the registry are bytes no gate ever
# read. There is also no `--provenance` in pnpm, putting sigstore attestation out of reach. Splitting
# the three responsibilities is what lets the audit sit BETWEEN the pack and the upload.
#
# `changeset tag` runs LAST, and only if every upload succeeded, so a half-published release
# never leaves tags claiming it landed.
#
# DRY_RUN=1 packs and audits and asks npm to rehearse the upload. It is the only way to
# learn whether `npm publish <tarball> --provenance` is accepted without publishing.
set -eu

self=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$self/../packages/tooling/src/repo-root.sh"
root=$(require_repo_root "$self")
cd "$root"

out="$root/.pack"
rm -rf "$out"
mkdir -p "$out"

# BUILD FIRST, IN TOPOLOGICAL ORDER. `pnpm pack` fires each package's `prepack`, which
# rebuilds it — but per package, in whatever order the pack loop happens to reach them. A
# package whose dts build resolves a SIBLING's types then fails, because the sibling has no
# `dist/` yet: measured on the first release run as `error occurred in dts build` from
# forge, in a job where nothing had built anything.
#
# `pnpm build` is turbo, which respects `dependsOn: ["^build"]`, so every `prepack` after
# this is a rebuild against a warm tree rather than a first build in the wrong order.
pnpm build

# AUDIT FIRST, on bytes packed the same way. If pack-smoke refuses, nothing is uploaded.
pnpm pack:smoke

# THE UPLOAD SET IS THE AUDIT SET, asked for by name rather than re-derived.
#
# This was a workspace filter over `./packages/*`, and it packed SIX tarballs while `pack:smoke`
# audited five — the extra was `@cratylus/canon`, which the changeset `ignore` list excludes
# and which must never reach the registry. A filter expresses "which directories"; the
# publish set is "not private AND not changeset-ignored", and those are different questions
# that happened to agree until they did not. An audit covering a different set than the
# upload is an audit of something else.
pnpm --filter @cratylus/canon exec tsx tooling/pack-smoke/pack-smoke-cli.ts --list |
	while IFS= read -r pkg; do
		[ -n "$pkg" ] || continue
		pnpm --filter "$pkg" exec pnpm pack --pack-destination "$out" >/dev/null
	done

count=$(find "$out" -name '*.tgz' | grep -c . || true)
[ "$count" -gt 0 ] || {
	echo "release: nothing packed" >&2
	exit 2
}
echo "release: $count tarball(s)"

for tgz in "$out"/*.tgz; do
	if [ "${DRY_RUN:-0}" = "1" ]; then
		npm publish "$tgz" --access public --provenance --tag "${DIST_TAG:-latest}" --dry-run
	else
		npm publish "$tgz" --access public --provenance --tag "${DIST_TAG:-latest}"
	fi
done

# A SNAPSHOT IS NOT TAGGED. Its versions are throwaway and unordered; a git tag would claim
# a release that no changelog records and no one can name. `changeset tag` is for `latest`.
[ "${DRY_RUN:-0}" = "1" ] || [ "${DIST_TAG:-latest}" != "latest" ] || pnpm exec changeset tag
rm -rf "$out"

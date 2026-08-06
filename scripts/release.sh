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

# AN ALREADY-PUBLISHED VERSION IS SKIPPED, AND THAT IS WHAT MAKES THIS PATH IDEMPOTENT.
#
# `changesets/action` runs this command on EVERY push to main, not only when it versioned
# something. With no pending changeset there is no bump, so the loop below re-packed the
# versions already on the registry and asked npm to publish them again — `npm error You
# cannot publish over the previously published versions: 0.1.1` — and the release job went
# red on every push from the 0.1.1 publish onward. Three consecutive failures before this
# was found, on commits that touched no package source at all.
#
# `changeset publish`, which the header above deliberately declines, has this skip built in;
# hand-rolling the upload meant hand-rolling the idempotence too, and that half was missed.
#
# ASK THE TARBALL WHAT IT IS, never its filename: npm flattens a scoped name, so
# `cratylus-forge-0.1.1.tgz` puts neither the scope boundary nor the version boundary
# anywhere a parse can find them without guessing.
#
# THE FAILURE DIRECTION IS DELIBERATE. A `npm view` that fails for any reason — network,
# auth, a registry hiccup — falls through to the publish, which then errors loudly. The
# alternative default would skip an upload on a transient error and report a green release
# that shipped nothing.
published=0
skipped=0
for tgz in "$out"/*.tgz; do
	meta=$(tar -xzOf "$tgz" package/package.json)
	name=$(printf '%s' "$meta" | node -p 'JSON.parse(require("fs").readFileSync(0,"utf8")).name')
	version=$(printf '%s' "$meta" | node -p 'JSON.parse(require("fs").readFileSync(0,"utf8")).version')

	if npm view "$name@$version" version >/dev/null 2>&1; then
		echo "release: $name@$version is already on the registry — skipping"
		skipped=$((skipped + 1))
		continue
	fi

	if [ "${DRY_RUN:-0}" = "1" ]; then
		npm publish "$tgz" --access public --provenance --tag "${DIST_TAG:-latest}" --dry-run
	else
		npm publish "$tgz" --access public --provenance --tag "${DIST_TAG:-latest}"
	fi
	published=$((published + 1))
done

# PRINT THE DENOMINATOR. "Nothing to publish" and "published everything" are both silent
# successes otherwise, and they are not the same outcome.
echo "release: $published published, $skipped already on the registry (of $count packed)"

# A SNAPSHOT IS NOT TAGGED. Its versions are throwaway and unordered; a git tag would claim
# a release that no changelog records and no one can name. `changeset tag` is for `latest`.
#
# NOTHING PUBLISHED MEANS NOTHING TO TAG. Tagging a run that uploaded nothing would move
# tags on behalf of a release that did not happen. This is a GUARD, not an early exit —
# the skip path is now the COMMON path (every push with no pending changeset takes it), so
# returning before the cleanup below would leave `.pack` behind on most runs.
if [ "$published" -gt 0 ]; then
	[ "${DRY_RUN:-0}" = "1" ] || [ "${DIST_TAG:-latest}" != "latest" ] || pnpm exec changeset tag
fi
rm -rf "$out"

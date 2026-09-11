#!/usr/bin/env sh
# The publish path: packing, auditing and uploading, all through pnpm.
#
# THE UPLOAD WAS npm AND IS NOT ANYMORE, because npm refuses to run here at all. The root
# manifest declares `devEngines.packageManager = pnpm` with `onFail: "error"`, and npm
# ENFORCES that against itself: every npm command whose cwd resolves to this workspace
# exits `EBADDEVENGINES — Invalid name "pnpm" does not match "npm"`. `--engine-strict=false`
# does not bypass it. Measured: the `release-next` guard's `npm view` loop reported all six
# packages unpublished while every one was on the registry, because it discarded stderr and
# a refusal read as an absence.
#
# `pnpm publish` takes what this script has: its argument is a `<tarball | folder>` (pnpm's
# own docs), so the AUDITED bytes are the uploaded bytes — no repack, and `prepack` cannot
# fire on a tarball that is already packed. It is native since v11 (it no longer shells out
# to npm), it carries `--provenance`, and it implements OIDC trusted publishing directly
# (`pnpm/crates/publish/src/oidc.rs`; issues #9812 and #11495, the latter making OIDC
# override a static `_authToken` exactly as npm does).
#
# NOT `changeset publish`, still. It publishes package DIRECTORIES, which fires `prepack`
# and rebuilds every package at upload time — the bytes reaching the registry would be bytes
# no gate ever read. Splitting pack · audit · upload is what lets the audit sit BETWEEN them.
#
# `changeset tag` runs LAST, and only if every upload succeeded, so a half-published release
# never leaves tags claiming it landed.
#
# DRY_RUN=1 packs and audits and asks the registry to rehearse the upload. It is the only way
# to learn whether `pnpm publish <tarball>` is accepted without publishing.
#
# PROVENANCE IS THE ENVIRONMENT'S CALL, and `PROVENANCE=1` is how the environment says it.
# It was `NPM_CONFIG_PROVENANCE`, read by npm as config; pnpm's honouring of the equivalent
# `PNPM_CONFIG_PROVENANCE` is NOT documented and a dry run cannot tell you (it neither warns
# nor attests), and an unattested upload that reports success is exactly the silent
# degradation this repo refuses. So the switch is translated to the documented CLI flag
# here — one line — and a laptop recovery publish still runs without it.
#
# GIT CHECKS OFF, deliberately. The uploader refuses an unclean tree or a non-release
# branch; npm never checked either, and the snapshot path REQUIRES a dirty tree, because
# `changeset version --snapshot` rewrites manifests without committing. Cleanliness is
# enforced where it belongs — the Release PR — and the bytes are gated by `pack:smoke`.
set -eu

self=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
. "$self/../packages/tooling/src/repo-root.sh"
root=$(require_repo_root "$self")
cd "$root"

out="$root/.pack"
rm -rf "$out"
mkdir -p "$out"

# The environment's provenance call, translated to the documented flag — see the header.
prov=''
[ "${PROVENANCE:-0}" = "1" ] && prov='--provenance'

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
# This was a workspace filter over `./packages/*`, which expresses "which directories";
# the publish set is "not private AND not changeset-ignored", and those are different
# questions that happened to agree until they did not. An audit covering a different set
# than the upload is an audit of something else.
#
# `@cratylus/canon` IS IN THE SET, and this comment used to claim the opposite — that the
# changeset `ignore` list excluded it and it "must never reach the registry". Both halves
# were false: `ignore` is `[]`, `pack-smoke --list` names canon, and `cratylus` DECLARES
# `@cratylus/canon` as a runtime dependency, so the command cannot resolve without it on
# the registry. The stale claim cost a mistaken deprecation of a required package before it
# was caught.
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
# THE FAILURE DIRECTION IS DELIBERATE. A `pnpm view` that fails for any reason — network,
# auth, a registry hiccup — falls through to the publish, which then errors loudly. The
# alternative default would skip an upload on a transient error and report a green release
# that shipped nothing.
published=0
skipped=0
failed=''
for tgz in "$out"/*.tgz; do
	meta=$(tar -xzOf "$tgz" package/package.json)
	name=$(printf '%s' "$meta" | node -p 'JSON.parse(require("fs").readFileSync(0,"utf8")).name')
	version=$(printf '%s' "$meta" | node -p 'JSON.parse(require("fs").readFileSync(0,"utf8")).version')

	if pnpm view "$name@$version" version >/dev/null 2>&1; then
		echo "release: $name@$version is already on the registry — skipping"
		skipped=$((skipped + 1))
		continue
	fi

	# EVERY TARBALL IS ATTEMPTED; ONE FAILURE DOES NOT HOLD THE REST HOSTAGE.
	#
	# Under `set -e` the first failing `npm publish` aborted the whole script, and
	# WHICH one that is comes down to glob order — alphabetical accident. Measured:
	# `cratylus-0.2.0.tgz` sorts ahead of every scoped sibling because the unscoped
	# name is a prefix of `cratylus-canon-…`, `cratylus-forge-…` and the rest. So a
	# 403 on one package took five publishable ones down with it, and the run
	# reported nothing about whether they would have succeeded.
	#
	# Continuing also buys the DIAGNOSIS: one run now says which packages the
	# credential can write and which it cannot, instead of stopping at the first.
	if [ "${DRY_RUN:-0}" = "1" ]; then
		pnpm publish "$tgz" --access public --tag "${DIST_TAG:-latest}" --no-git-checks $prov --dry-run || failed="$failed $name"
	else
		pnpm publish "$tgz" --access public --tag "${DIST_TAG:-latest}" --no-git-checks $prov || failed="$failed $name"
	fi
	case " $failed " in
	*" $name "*) ;;
	*) published=$((published + 1)) ;;
	esac
done

# PRINT THE DENOMINATOR. "Nothing to publish" and "published everything" are both silent
# successes otherwise, and they are not the same outcome.
echo "release: $published published, $skipped already on the registry (of $count packed)"

# A SNAPSHOT IS NOT TAGGED. Its versions are throwaway and unordered; a git tag would claim
# a release that no changelog records and no one can name. `changeset tag` is for `latest`.
#
# A PARTIAL RELEASE IS NOT A RELEASE, and nothing published means nothing to tag. Tagging claims every package shipped, so the
# tag is withheld unless every upload succeeded — and the run exits non-zero so the
# failure cannot read as success. What DID publish stays published; that is a fact
# about npm, not a choice, and the exit code is what keeps it from being silent.
if [ -n "$failed" ]; then
	echo "release: FAILED to publish:$failed" >&2
	rm -rf "$out"
	exit 1
fi

if [ "$published" -gt 0 ]; then
	[ "${DRY_RUN:-0}" = "1" ] || [ "${DIST_TAG:-latest}" != "latest" ] || pnpm exec changeset tag
fi
rm -rf "$out"

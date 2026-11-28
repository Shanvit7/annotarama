#!/usr/bin/env sh
set -eu

project_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$project_root"

for check in check-ascii-backdrop check-live-camera check-annotation-ui; do
	printf '\n==> %s\n' "$check"
	ego-browser nodejs < "scripts/ego-browser/$check.mjs"
done

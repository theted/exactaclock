#!/usr/bin/env bash
# Assemble the publishable site into dist/.
#
# There is nothing to compile — index.html loads src/*.js as ES modules straight from the browser.
# This exists so the deploy has a directory that contains the site and nothing else.
#
# The sync this replaced pointed at the repo root and named what to leave behind: .git, node_modules,
# the Dockerfile, the tests, idea.md, every config file. A denylist fails open. Anything added to the
# repo and not added to that list ships to a public bucket, and nothing tells you it happened.
# Listing what goes in is the same work and fails closed instead.
set -euo pipefail

DIST="${1:-dist}"

rm -rf "$DIST"
mkdir -p "$DIST"

cp index.html "$DIST/"
cp -r src "$DIST/"

# src/ is the app and its tests in one directory; the tests are not part of the site.
find "$DIST/src" -name '*.test.js' -delete

test -f "$DIST/index.html"
test -f "$DIST/src/app.js"
test -f "$DIST/src/styles/base.css"

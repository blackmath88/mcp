#!/bin/sh
# Assemble the public site into dist/: landing page at /, workbench at /lab/.
# Only runtime files are copied; repository docs, notes and tests stay private.
set -eu
cd "$(dirname "$0")/.."
rm -rf dist
mkdir -p dist/lab
cp -R site/. dist/
for f in index.html app.js style.css polish.css light.css catalog.mjs notes.mjs visual.mjs motion.mjs icons.mjs; do
  cp "lab/$f" "dist/lab/$f"
done
echo "Built dist/ ($(find dist -type f | wc -l | tr -d ' ') files)"

#!/bin/sh
# Ask a Codex CLI agent (GPT-6.1 Sol, built-in image_gen, no API key) to paint whole worlds per ${TASK:-TASK2.md}.
# Usage: sh WW/scripts/codex-world.sh <world> [<world>...]   (run from the repo root)
start=$(date +%s)
names=$(echo "$@" | tr ' ' '+')
log="WW/data/codex/log${TASK%.md}-$names.txt"
codex exec -m gpt-6.1-sol -s workspace-write --skip-git-repo-check \
  "Read WW/data/codex/${TASK:-TASK2.md} and follow it. Your assigned worlds: $*." > "$log" 2>&1
code=$?
echo "TOTAL $(( $(date +%s) - start ))s exit $code" >> "$log"

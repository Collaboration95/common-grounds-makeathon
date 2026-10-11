#!/bin/sh
# Ask a Codex CLI agent (GPT-6.1 Sol, built-in image_gen, no API key) to paint two scenes.
# Usage: sh WW/scripts/codex-paint.sh <scene> <scene>   (run from the repo root)
start=$(date +%s)
log="WW/data/codex/log-$1+$2.txt"
codex exec -m gpt-6.1-sol -s workspace-write --skip-git-repo-check \
  "Read WW/data/codex/TASK.md and follow it. Your assigned scenes: $1 and $2." > "$log" 2>&1
code=$?
echo "TOTAL $(( $(date +%s) - start ))s exit $code" >> "$log"

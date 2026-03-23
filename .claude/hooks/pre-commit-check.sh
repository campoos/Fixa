#!/bin/bash
# pre-commit-check.sh — PreToolUse: make check antes de git commit
# Requer: jq (brew install jq)

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if ! echo "$COMMAND" | grep -qE 'git\s+commit'; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
cd "$PROJECT_DIR"

if [[ ! -f "Makefile" ]]; then
  exit 0
fi

if ! make check; then
  echo "make check falhou. Corrija os erros antes de commitar." >&2
  exit 2
fi

exit 0

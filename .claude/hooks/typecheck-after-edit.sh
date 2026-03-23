#!/bin/bash
# typecheck-after-edit.sh — PostToolUse: validação de tipos após edição
# .ts/.tsx → tsc --noEmit | .cs → dotnet build
# Requer: jq (brew install jq)

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.edits[0].file_path // empty')

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# ===== TypeScript (.ts / .tsx) =====
if echo "$FILE_PATH" | grep -qE '\.(ts|tsx)$'; then
  DIR="$(cd "$(dirname "$FILE_PATH")" && pwd)"
  while [[ "$DIR" != "/" ]]; do
    if [[ -f "$DIR/package.json" ]]; then
      break
    fi
    DIR="$(dirname "$DIR")"
  done

  if [[ "$DIR" == "/" ]]; then
    exit 0
  fi

  cd "$DIR"

  if grep -q '"typecheck"' package.json 2>/dev/null; then
    OUTPUT=$(yarn typecheck 2>&1)
    EXIT_CODE=$?
  elif [[ -f "node_modules/.bin/tsc" ]] || command -v npx &>/dev/null; then
    OUTPUT=$(npx tsc --noEmit 2>&1)
    EXIT_CODE=$?
  else
    exit 0
  fi

  if [[ $EXIT_CODE -ne 0 ]]; then
    echo "TypeScript encontrou erros de tipo. Corrija:" >&2
    echo "$OUTPUT" >&2
    exit 2
  fi

  exit 0
fi

# ===== C# (.cs) =====
if echo "$FILE_PATH" | grep -qE '\.cs$'; then
  DIR="$(cd "$(dirname "$FILE_PATH")" && pwd)"
  while [[ "$DIR" != "/" ]]; do
    if ls "$DIR"/*.sln >/dev/null 2>&1; then
      break
    fi
    DIR="$(dirname "$DIR")"
  done

  if [[ "$DIR" == "/" ]]; then
    exit 0
  fi

  cd "$DIR"

  OUTPUT=$(dotnet build --nologo -v q 2>&1)
  EXIT_CODE=$?

  if [[ $EXIT_CODE -ne 0 ]]; then
    echo "dotnet build encontrou erros. Corrija:" >&2
    echo "$OUTPUT" >&2
    exit 2
  fi

  exit 0
fi

exit 0

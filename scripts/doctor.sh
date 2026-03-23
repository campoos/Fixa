#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Workspace root: ${WORKSPACE_ROOT}"

check_command() {
  local cmd="$1"
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "Missing required command: ${cmd}" >&2
    return 1
  fi
}

status=0

echo "Checking required tools..."

if ! check_command git; then status=1; fi

if ! check_command node; then
  echo "Warning: node not found. Required for vibe-mobile-app." >&2
  status=1
fi
if ! check_command yarn; then
  echo "Warning: yarn not found. Required for vibe-mobile-app." >&2
  status=1
fi

if ! check_command dotnet; then
  echo "Warning: dotnet not found. Required for vibe-bff." >&2
  status=1
fi

if [[ -f "${WORKSPACE_ROOT}/.nvmrc" ]]; then
  required_node_version="$(cat "${WORKSPACE_ROOT}/.nvmrc")"
  current_node_version="$(node -v 2>/dev/null || echo "unknown")"
  echo "Required Node version (from .nvmrc): ${required_node_version}"
  echo "Current Node version: ${current_node_version}"

  if [[ "${current_node_version}" != "unknown" && "${current_node_version}" != "${required_node_version}" ]]; then
    echo "Warning: Node version does not match .nvmrc. Consider running 'nvm use'." >&2
  fi
fi

if command -v dotnet >/dev/null 2>&1; then
  echo ".NET SDK version: $(dotnet --version)"
fi

echo ""
echo "Checking repos..."

REPOS_LIST_FILE="${WORKSPACE_ROOT}/repos.list"
if [[ -f "${REPOS_LIST_FILE}" ]]; then
  while IFS= read -r line; do
    [[ -z "${line}" ]] && continue
    [[ "${line}" =~ ^# ]] && continue

    if [[ "${line}" == *"|"* ]]; then
      repo_name="${line%%|*}"
      repo_path="$(cd "${WORKSPACE_ROOT}" && cd "${line#*|}" && pwd)"
    else
      repo_name="${line}"
      repo_path="${WORKSPACE_ROOT}/repos/${repo_name}"
    fi

    if [[ ! -d "${repo_path}" ]]; then
      echo "Warning: repo ${repo_name} not found at ${repo_path}" >&2
      continue
    fi

    if ls "${repo_path}"/*.sln >/dev/null 2>&1; then
      echo "  ${repo_name}: .NET project detected"
    elif [[ -f "${repo_path}/package.json" ]]; then
      echo "  ${repo_name}: Node.js project detected"
    else
      echo "  ${repo_name}: unknown stack (no .sln or package.json found)"
    fi
  done < "${REPOS_LIST_FILE}"
else
  echo "repos.list not found. Doctor will skip repo checks."
fi

echo ""
if [[ "${status}" -ne 0 ]]; then
  echo "Doctor checks FAILED. Please install the missing tools above." >&2
else
  echo "Doctor checks completed. All required tools are available."
fi

exit "${status}"

#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPOS_LIST_FILE="${WORKSPACE_ROOT}/repos.list"

if [[ ! -f "${REPOS_LIST_FILE}" ]]; then
  echo "repos.list not found at ${REPOS_LIST_FILE}. Create it with one repo per line." >&2
  exit 1
fi

echo "Running bootstrap in all repos from repos.list..."

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
    echo "Skipping ${repo_name}: directory ${repo_path} does not exist." >&2
    continue
  fi

  echo "------------------------------------------------------------"
  echo "Bootstrapping ${repo_name}..."

  if ls "${repo_path}"/*.sln >/dev/null 2>&1; then
    echo "  (.NET project — running dotnet restore)"
    (cd "${repo_path}" && dotnet restore)
  elif [[ -f "${repo_path}/package.json" ]]; then
    echo "  (Node.js project — running yarn install)"
    (cd "${repo_path}" && yarn install)
  else
    echo "  Skipping ${repo_name}: no .sln or package.json found." >&2
  fi
done < "${REPOS_LIST_FILE}"

echo "Bootstrap completed."

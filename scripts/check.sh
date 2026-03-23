#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPOS_LIST_FILE="${WORKSPACE_ROOT}/repos.list"

if [[ ! -f "${REPOS_LIST_FILE}" ]]; then
  echo "repos.list not found at ${REPOS_LIST_FILE}. Create it with one repo per line." >&2
  exit 1
fi

overall_status=0

echo "Running quality gate in all repos from repos.list..."

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
  echo "Checking ${repo_name}..."

  pushd "${repo_path}" >/dev/null

  if ls *.sln >/dev/null 2>&1; then
    echo "  (.NET project — build + test)"

    if dotnet build --configuration Release --nologo -v q; then
      echo "  dotnet build passed for ${repo_name}."
    else
      echo "  dotnet build FAILED for ${repo_name}." >&2
      overall_status=1
    fi

    if dotnet test --configuration Release --no-build --nologo -v q; then
      echo "  dotnet test passed for ${repo_name}."
    else
      echo "  dotnet test FAILED for ${repo_name}." >&2
      overall_status=1
    fi

  elif [[ -f "package.json" ]]; then
    echo "  (Node.js project — check or lint+test)"

    if yarn run -s check >/dev/null 2>&1; then
      echo "  yarn check passed for ${repo_name}."
    else
      echo "  yarn check not available or failed, falling back to lint + test..."

      if grep -q '"lint"' package.json 2>/dev/null; then
        if yarn run -s lint; then
          echo "  yarn lint passed for ${repo_name}."
        else
          echo "  yarn lint FAILED for ${repo_name}." >&2
          overall_status=1
        fi
      else
        echo "  No lint script found for ${repo_name}, skipping."
      fi

      if grep -q '"test"' package.json 2>/dev/null; then
        if yarn run -s test; then
          echo "  yarn test passed for ${repo_name}."
        else
          echo "  yarn test FAILED for ${repo_name}." >&2
          overall_status=1
        fi
      else
        echo "  No test script found for ${repo_name}, skipping."
      fi
    fi

  else
    echo "  Skipping ${repo_name}: no .sln or package.json found." >&2
  fi

  popd >/dev/null
done < "${REPOS_LIST_FILE}"

echo "------------------------------------------------------------"
if [[ "${overall_status}" -ne 0 ]]; then
  echo "One or more repos failed checks." >&2
else
  echo "All repos passed checks."
fi

exit "${overall_status}"

#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILES_DIR="${WORKSPACE_ROOT}/scripts/dev-profiles"

PROFILE="dev"

usage() {
  echo "Usage: $0 [--profile NAME]" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      PROFILE="${2:-}"
      shift 2
      ;;
    -*)
      usage
      ;;
    *)
      usage
      ;;
  esac
done

mkdir -p "${PROFILES_DIR}"

PROFILE_FILE="${PROFILES_DIR}/${PROFILE}.conf"

if [[ ! -f "${PROFILE_FILE}" ]]; then
  echo "Profile file not found: ${PROFILE_FILE}" >&2
  echo "Create it with lines in the format: <repo-name>:<command> (e.g. api-repo:dotnet run)" >&2
  exit 1
fi

echo "Starting dev profile '${PROFILE}' using ${PROFILE_FILE}..."

pids=()

trap 'echo "Stopping dev profile..."; for pid in "${pids[@]}"; do kill "${pid}" 2>/dev/null || true; done; exit 0' SIGINT SIGTERM

get_repo_path() {
  local name="$1"
  while IFS= read -r rline; do
    [[ -z "${rline}" || "${rline}" =~ ^# ]] && continue
    if [[ "${rline}" == *"|"* ]]; then
      rname="${rline%%|*}"
      rpath="$(cd "${WORKSPACE_ROOT}" && cd "${rline#*|}" && pwd)"
    else
      rname="${rline}"
      rpath="${WORKSPACE_ROOT}/repos/${rline}"
    fi
    [[ "${rname}" == "${name}" ]] && echo "${rpath}" && return
  done < "${WORKSPACE_ROOT}/repos.list"
  echo "${WORKSPACE_ROOT}/repos/${name}"
}

while IFS= read -r line; do
  [[ -z "${line}" ]] && continue
  [[ "${line}" =~ ^# ]] && continue

  repo_name="${line%%:*}"
  command="${line#*:}"

  repo_path="$(get_repo_path "${repo_name}")"

  if [[ ! -d "${repo_path}" ]]; then
    echo "Skipping ${repo_name}: directory ${repo_path} does not exist." >&2
    continue
  fi

  echo "------------------------------------------------------------"
  echo "[${repo_name}] Starting: ${command}"

  (
    cd "${repo_path}"
    # shellcheck disable=SC2086
    ${command}
  ) &

  pids+=("$!")
done < "${PROFILE_FILE}"

if [[ "${#pids[@]}" -eq 0 ]]; then
  echo "No processes started for profile '${PROFILE}' (check your .conf file)." >&2
  exit 1
fi

echo "Dev processes running. Press Ctrl+C to stop."

wait

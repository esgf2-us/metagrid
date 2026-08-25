#!/usr/bin/env bash

set -euo pipefail

NAMESPACE="metagrid"
RELEASE="metagrid"
VALUES_FILE="nersc-dev.yaml"
CHART_PATH="./helm/"
FALLBACK_TAG="v1.5.5"

DETECTED_PR_TAG=""
DEFAULT_TAG=""
REPO_SLUG=""
GIT_BRANCH=""

clear_screen() {
  if command -v clear >/dev/null 2>&1; then
    clear
  else
    printf '\033c'
  fi
}

get_git_branch() {
  if [ -n "$GIT_BRANCH" ]; then
    echo "$GIT_BRANCH"
    return
  fi

  GIT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  echo "$GIT_BRANCH"
}

get_repo_slug() {
  if [ -n "$REPO_SLUG" ]; then
    echo "$REPO_SLUG"
    return
  fi

  if command -v gh >/dev/null 2>&1; then
    REPO_SLUG="$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null || true)"
  fi

  echo "$REPO_SLUG"
}

detect_pr_tag() {
  local branch pr_number

  if [ -n "$DETECTED_PR_TAG" ]; then
    echo "$DETECTED_PR_TAG"
    return
  fi

  branch="$(get_git_branch)"

  # 1) Most reliable: ask GitHub CLI for the PR attached to this branch
  if command -v gh >/dev/null 2>&1 && [ -n "$branch" ]; then
    pr_number="$(gh pr list --head "$branch" --json number --jq '.[0].number' 2>/dev/null || true)"

    if [[ "$pr_number" =~ ^[0-9]+$ ]]; then
      DETECTED_PR_TAG="pr-$pr_number"
      echo "$DETECTED_PR_TAG"
      return
    fi
  fi

  # 2) Fallback: extract a number from the branch name
  if [[ "$branch" =~ ([0-9]+) ]]; then
    DETECTED_PR_TAG="pr-${BASH_REMATCH[1]}"
    echo "$DETECTED_PR_TAG"
    return
  fi

  return 1
}

init_tags() {
  if [ -n "$DEFAULT_TAG" ]; then
    return
  fi

  local detected
  detected="$(detect_pr_tag || true)"

  if [ -n "$detected" ]; then
    DEFAULT_TAG="$detected"
  else
    DEFAULT_TAG="$FALLBACK_TAG"
  fi
}

format_tag() {
  local input="$1"
  local default_tag="$2"

  if [ -z "$input" ]; then
    echo "$default_tag"
    return
  fi

  if [[ "$input" =~ ^[0-9]+$ ]]; then
    echo "pr-$input"
    return
  fi

  echo "$input"
}

prompt_tag() {
  init_tags
  local input
  read -r -p "Enter tag (PR number or full tag) [${DEFAULT_TAG}]: " input
  format_tag "$input" "$DEFAULT_TAG"
}

confirm_action() {
  local message="$1"
  local response

  read -r -p "${message} [y/N]: " response
  case "$response" in
    y|Y|yes|YES) return 0 ;;
    *) echo "Cancelled."; return 1 ;;
  esac
}

get_deployed_images() {
  kubectl get deployment -n "$NAMESPACE" \
    -o jsonpath='{range .items[*]}{.metadata.name}{"|"}{.spec.template.spec.containers[*].image}{"\n"}{end}' \
    2>/dev/null || true
}

extract_tag_from_image() {
  local image="$1"
  echo "${image##*:}"
}

get_deployed_tag_for_component() {
  local component="$1"
  local lines line image

  lines="$(get_deployed_images)"
  if [ -z "$lines" ]; then
    return
  fi

  while IFS= read -r line; do
    case "$line" in
      *"$component"*)
        image="${line#*|}"
        extract_tag_from_image "$image"
        return
        ;;
    esac
  done <<< "$lines"
}

get_frontend_tag() {
  get_deployed_tag_for_component "frontend" || true
}

get_backend_tag() {
  get_deployed_tag_for_component "backend" || true
}

pause() {
  echo
  read -r -p "Press Enter to continue..."
}

header() {
  init_tags

  local branch frontend_tag backend_tag
  branch="$(get_git_branch)"
  frontend_tag="$(get_frontend_tag || true)"
  backend_tag="$(get_backend_tag || true)"

  clear_screen
  echo "=================================="
  echo " Metagrid Helm Helper"
  echo " Namespace      : ${NAMESPACE}"
  echo " Release        : ${RELEASE}"
  echo " Branch         : ${branch:-unknown}"
  echo " Detected PR tag: ${DETECTED_PR_TAG:-none}"
  echo " Default tag    : ${DEFAULT_TAG}"
  echo " Frontend tag   : ${frontend_tag:-unknown}"
  echo " Backend tag    : ${backend_tag:-unknown}"
  echo "=================================="
  echo
}

upgrade_tag() {
  local tag
  tag="$(prompt_tag)"
  echo
  echo "Planned upgrade:"
  echo "  frontend.image.tag=${tag}"
  echo "  backend.image.tag=${tag}"
  echo

  if ! confirm_action "Run helm upgrade"; then
    return
  fi

  helm upgrade -f "$VALUES_FILE" "$RELEASE" "$CHART_PATH" \
    --set frontend.image.tag="$tag" \
    --set backend.image.tag="$tag" \
    --namespace "$NAMESPACE" --rollback-on-failure --timeout 10m
}

upgrade_tag_fresh() {
  local tag
  tag="$(prompt_tag)"
  echo
  echo "Planned upgrade with forced fresh pulls:"
  echo "  frontend.image.tag=${tag}"
  echo "  backend.image.tag=${tag}"
  echo "  frontend.image.pullPolicy=Always"
  echo "  backend.image.pullPolicy=Always"
  echo

  if ! confirm_action "Run helm upgrade with forced fresh pulls"; then
    return
  fi

  helm upgrade -f "$VALUES_FILE" "$RELEASE" "$CHART_PATH" \
    --set frontend.image.tag="$tag" \
    --set backend.image.tag="$tag" \
    --set frontend.image.pullPolicy=Always \
    --set backend.image.pullPolicy=Always \
    --namespace "$NAMESPACE" --rollback-on-failure --timeout 10m
}

redeploy_values() {
  echo "Planned redeploy using values file only:"
  echo "  ${VALUES_FILE}"
  echo

  if ! confirm_action "Run helm upgrade using values file"; then
    return
  fi

  helm upgrade -f "$VALUES_FILE" "$RELEASE" "$CHART_PATH" \
    --namespace "$NAMESPACE" --rollback-on-failure --timeout 10m
}

rollback_prev() {
  echo "Planned rollback:"
  echo "  previous revision"
  echo

  if ! confirm_action "Run rollback to previous revision"; then
    return
  fi

  helm rollback "$RELEASE" 0 -n "$NAMESPACE"
}

rollback_specific() {
  local revision
  read -r -p "Enter revision number: " revision
  [ -z "$revision" ] && echo "No revision entered." && return

  echo
  echo "Planned rollback:"
  echo "  revision ${revision}"
  echo

  if ! confirm_action "Run rollback to revision ${revision}"; then
    return
  fi

  helm rollback "$RELEASE" "$revision" -n "$NAMESPACE"
}

show_history() {
  helm history "$RELEASE" -n "$NAMESPACE"
}

show_status() {
  helm status "$RELEASE" -n "$NAMESPACE"
}

list_pods() {
  kubectl get pods -n "$NAMESPACE"
}

describe_pod() {
  local pod
  read -r -p "Enter pod name: " pod
  [ -z "$pod" ] && echo "No pod entered." && return
  kubectl describe pod "$pod" -n "$NAMESPACE"
}

show_logs() {
  local pod
  read -r -p "Enter pod name: " pod
  [ -z "$pod" ] && echo "No pod entered." && return
  kubectl logs "$pod" -n "$NAMESPACE"
}

show_events() {
  kubectl get events -n "$NAMESPACE" --sort-by=.lastTimestamp | tail -30
}

show_images() {
  kubectl get pods -n "$NAMESPACE" -o jsonpath='{range .items[*]}{.metadata.name}{" -> "}{.spec.containers[*].image}{" | "}{.status.containerStatuses[*].imageID}{"\n"}{end}'
  echo
}

dry_run() {
  local tag
  tag="$(prompt_tag)"
  echo
  echo "Planned dry run:"
  echo "  frontend.image.tag=${tag}"
  echo "  backend.image.tag=${tag}"
  echo

  if ! confirm_action "Run dry run"; then
    return
  fi

  helm upgrade -f "$VALUES_FILE" "$RELEASE" "$CHART_PATH" \
    --set frontend.image.tag="$tag" \
    --set backend.image.tag="$tag" \
    --namespace "$NAMESPACE" --dry-run --debug
}

list_secrets() {
  kubectl get secrets -n "$NAMESPACE" | grep "$RELEASE" || true
}

deploy_menu() {
  while true; do
    header
    cat <<EOF
Deploy Menu
-----------
1) Upgrade to tag
2) Upgrade + force fresh pulls
3) Redeploy values only
4) Dry run
0) Back
EOF
    read -r -p "Choice: " choice
    echo
    case "$choice" in
      1) upgrade_tag; pause ;;
      2) upgrade_tag_fresh; pause ;;
      3) redeploy_values; pause ;;
      4) dry_run; pause ;;
      0) return ;;
      *) echo "Invalid option"; pause ;;
    esac
  done
}

rollback_menu() {
  while true; do
    header
    cat <<EOF
Rollback / History
------------------
1) Rollback previous
2) Rollback specific
3) History
4) Status
0) Back
EOF
    read -r -p "Choice: " choice
    echo
    case "$choice" in
      1) rollback_prev; pause ;;
      2) rollback_specific; pause ;;
      3) show_history; pause ;;
      4) show_status; pause ;;
      0) return ;;
      *) echo "Invalid option"; pause ;;
    esac
  done
}

debug_menu() {
  while true; do
    header
    cat <<EOF
Kubernetes Debug
----------------
1) Pods
2) Describe pod
3) Logs
4) Events
5) Images (with SHA)
0) Back
EOF
    read -r -p "Choice: " choice
    echo
    case "$choice" in
      1) list_pods; pause ;;
      2) describe_pod; pause ;;
      3) show_logs; pause ;;
      4) show_events; pause ;;
      5) show_images; pause ;;
      0) return ;;
      *) echo "Invalid option"; pause ;;
    esac
  done
}

utilities_menu() {
  while true; do
    header
    cat <<EOF
Utilities
---------
1) Helm secrets
0) Back
EOF
    read -r -p "Choice: " choice
    echo
    case "$choice" in
      1) list_secrets; pause ;;
      0) return ;;
      *) echo "Invalid option"; pause ;;
    esac
  done
}

main_menu() {
  clear_screen
  while true; do
    header
    cat <<EOF
Main Menu
---------
1) Deploy
2) Rollback / History
3) Kubernetes Debug
4) Utilities
0) Exit
EOF
    read -r -p "Choice: " choice
    echo
    case "$choice" in
      1) deploy_menu ;;
      2) rollback_menu ;;
      3) debug_menu ;;
      4) utilities_menu ;;
      0) echo "Goodbye."; exit 0 ;;
      *) echo "Invalid option"; pause ;;
    esac
  done
}

main_menu

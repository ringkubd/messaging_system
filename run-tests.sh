#!/usr/bin/env bash
# Quick test runner — bypasses Collision PHP 8.4 compatibility issue
set -euo pipefail

FILTER="${1:-}"

cd "$(dirname "$0")"

ARGS=()
[[ -n "$FILTER" ]] && ARGS+=(--filter "$FILTER")

php -d error_reporting="E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED" \
    vendor/bin/phpunit "${ARGS[@]}" 2>/dev/null | tail -5

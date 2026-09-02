#!/usr/bin/env bash
# =============================================================================
# @file scripts/check-docker-images.sh
# @description Trivy image scanning entrypoint for Figentra container artifacts.
# @security Fail on HIGH/CRITICAL vulnerabilities in CI.
# =============================================================================
set -euo pipefail

IMAGE="${1:-}"
if [[ -z "$IMAGE" ]]; then
  echo "Usage: $0 <image>" >&2
  exit 2
fi

if ! command -v trivy >/dev/null 2>&1; then
  echo "trivy is required for Docker image scanning." >&2
  exit 127
fi

trivy image --severity HIGH,CRITICAL --exit-code 1 "$IMAGE"

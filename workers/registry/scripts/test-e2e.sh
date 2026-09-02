#!/usr/bin/env bash
# =============================================================================
# test-e2e.sh — Figentra Application Registry Worker E2E Test Suite
#
# Tests every REST endpoint of the Registry Worker against a live local server.
# Requires: curl, jq, openssl, node >= 24, wrangler dev running on port 8787.
#
# Usage:
#   bash scripts/test-e2e.sh [--url http://127.0.0.1:8787] [--verbose]
#
# Exit codes:
#   0  All tests passed
#   1  One or more tests failed
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
REGISTRY_URL="${REGISTRY_URL:-http://127.0.0.1:8787}"
VERBOSE="${VERBOSE:-false}"
PASS=0
FAIL=0

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --url) REGISTRY_URL="$2"; shift 2 ;;
    --verbose) VERBOSE=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Terminal colour helpers
# ---------------------------------------------------------------------------
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
CYAN="\033[0;36m"
BOLD="\033[1m"
RESET="\033[0m"

section() { echo -e "\n${BOLD}${CYAN}==> $1${RESET}"; }
pass()    { PASS=$((PASS+1)); echo -e "  ${GREEN}✔ $1${RESET}"; }
fail()    { FAIL=$((FAIL+1)); echo -e "  ${RED}✘ $1${RESET}"; }
warn()    { echo -e "  ${YELLOW}⚠ $1${RESET}"; }
debug()   { [[ "$VERBOSE" == "true" ]] && echo -e "    ${RESET}$1" || true; }

# ---------------------------------------------------------------------------
# JWT generation (RSA keypair using openssl + node)
# ---------------------------------------------------------------------------
section "Generating test RSA keypair and JWT"

TMPDIR_JWT="$(mktemp -d)"
PRIV_KEY="$TMPDIR_JWT/private.pem"
PUB_KEY="$TMPDIR_JWT/public.pem"

openssl genrsa -out "$PRIV_KEY" 2048 2>/dev/null
openssl rsa -in "$PRIV_KEY" -pubout -out "$PUB_KEY" 2>/dev/null

# Build a compact JWT using Node 24 — real RSA-PS256 signing
JWT_SERVICE_TOKEN=$(PRIV_KEY="$PRIV_KEY" IDENTITY_ISSUER="${IDENTITY_ISSUER:-https://identity.figentra.dev}" node --input-type=module <<'EOF'
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';

const privateKey = readFileSync(process.env.PRIV_KEY);

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

const header = base64url(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'test-key-1' })));
const payload = base64url(Buffer.from(JSON.stringify({
  sub: 'svc:registry-test',
  sid: 'svc:registry-test',
  iss: process.env.IDENTITY_ISSUER || 'https://identity.figentra.dev',
  aud: ['figentra:registry:registration', 'figentra:registry', 'figentra:registry:route-resolution'],
  principal_type: 'service',
  permissions: ['registry:application:register', 'registry:read', 'registry:route:resolve'],
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
})));

const sign = createSign('SHA256');
sign.update(`${header}.${payload}`);
const sig = base64url(sign.sign(privateKey));
process.stdout.write(`${header}.${payload}.${sig}`);
EOF
)

# Because the wrangler dev JWKS endpoint verifies signatures against the configured IDENTITY_JWKS_URL,
# for local testing we use the pre-configured dev JWT if REGISTRY_TOKEN is set, or fall back to an
# unsigned test token that the local wrangler dev may accept in NODE_ENV=test bypass mode.
if [[ -n "${REGISTRY_TOKEN:-}" ]]; then
  SERVICE_TOKEN="$REGISTRY_TOKEN"
  warn "Using REGISTRY_TOKEN from environment."
else
  SERVICE_TOKEN="${JWT_SERVICE_TOKEN:-}"
  warn "No REGISTRY_TOKEN set — using locally-generated test token (only works if worker runs in test/bypass mode)."
fi

AUTH_HEADER="Authorization: Bearer $SERVICE_TOKEN"
READ_TOKEN="${REGISTRY_READ_TOKEN:-$SERVICE_TOKEN}"
ROUTE_TOKEN="${REGISTRY_ROUTE_TOKEN:-$SERVICE_TOKEN}"

cleanup() { rm -rf "$TMPDIR_JWT"; }
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Helper: make an HTTP request and return the response body + status
# ---------------------------------------------------------------------------
http() {
  local method="$1" url="$2"
  shift 2
  local status body tmp
  tmp="$(mktemp)"
  body=$(curl -s -o "$tmp" -w "%{http_code}" -X "$method" "$@" "$url" 2>/dev/null || echo "000")
  status="$body"
  body="$(cat "$tmp")"
  rm -f "$tmp"
  debug "  $method $url -> $status"
  debug "  Body: $(echo "$body" | head -c 500)"
  echo "$status|$body"
}

assert_status() {
  local label="$1" expected="$2" response="$3"
  local actual="${response%%|*}"
  if [[ "$actual" == "$expected" ]]; then
    pass "$label (HTTP $actual)"
  else
    fail "$label — expected HTTP $expected, got $actual"
  fi
}

assert_json_field() {
  local label="$1" field="$2" expected_pattern="$3" body="$4"
  local value
  value=$(echo "$body" | jq -r "$field" 2>/dev/null || echo "INVALID_JSON")
  if [[ "$value" =~ $expected_pattern ]]; then
    pass "$label ($field = $value)"
  else
    fail "$label — expected $field to match /$expected_pattern/, got: $value"
  fi
}

response_body() { echo "${1#*|}"; }
response_status() { echo "${1%%|*}"; }

# ===========================================================================
# Phase 1: Health Endpoints
# ===========================================================================
section "Phase 1: Health Endpoints"

RESP=$(http GET "$REGISTRY_URL/health/live")
assert_status "GET /health/live returns 200" "200" "$RESP"
BODY=$(response_body "$RESP")
assert_json_field "/health/live status field" ".status" "ok" "$BODY"

RESP=$(http GET "$REGISTRY_URL/health/ready")
assert_status "GET /health/ready returns 200" "200" "$RESP"

# ===========================================================================
# Phase 2: Registration — POST /v1/registrations
# ===========================================================================
section "Phase 2: Application Registration"

TEST_SLUG="e2e-app-$(date +%s)"

MANIFEST=$(cat <<MANIFEST
{
  "slug": "$TEST_SLUG",
  "displayName": "E2E Test Application",
  "description": "Automated E2E test registration",
  "version": "1.0.0",
  "environments": [{ "environment": "development", "deploymentUrl": "https://e2e.figentra.com" }],
  "modules": [{ "key": "core", "description": "Core module" }],
  "resources": [{ "key": "item", "moduleKey": "core" }],
  "actions": [{ "key": "item:read", "resourceKey": "item", "permission": "core:item:read" }],
  "navigation": [{ "key": "dashboard", "path": "/dashboard", "label": "Dashboard", "permission": "core:item:read" }],
  "workflowDefinitions": [{ "key": "onboard-user", "runtime": "cloudflare-workflow", "worker": "e2e-worker", "version": "1" }],
  "eventDefinitions": [{ "key": "user.created", "direction": "produces", "topic": "user.created", "version": "1" }],
  "integrations": [{ "key": "stripe", "provider": "stripe", "kind": "payment" }],
  "settings": [{ "key": "stripe-api-key", "type": "string", "required": true, "sensitive": true }],
  "features": [{ "key": "new-dashboard", "defaultEnabled": false }],
  "widgets": [{ "key": "user-count", "component": "UserCountWidget", "version": "1" }],
  "localization": [{ "key": "core-i18n", "namespace": "core", "locales": ["en", "ar"] }],
  "routes": [
    { "method": "GET", "pathPattern": "/api/e2e/items", "upstream": "https://e2e.figentra.com", "audience": "figentra:e2e", "requiredPermission": "core:item:read" },
    { "method": "POST", "pathPattern": "/api/e2e/items", "upstream": "https://e2e.figentra.com", "audience": "figentra:e2e", "requiredPermission": "core:item:write" }
  ]
}
MANIFEST
)

RESP=$(http POST "$REGISTRY_URL/v1/registrations" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d "$MANIFEST")
assert_status "POST /v1/registrations returns 201" "201" "$RESP"
BODY=$(response_body "$RESP")
assert_json_field "Registration returns slug" ".slug" "$TEST_SLUG" "$BODY"
assert_json_field "Registration returns version" ".version" "1.0.0" "$BODY"
assert_json_field "Registration returns id" ".id" ".+" "$BODY"
assert_json_field "Registration returns contentHash" ".contentHash" ".+" "$BODY"
CONTENT_HASH=$(echo "$BODY" | jq -r '.contentHash')

# Re-submit same manifest → should be idempotent or conflict (409)
RESP=$(http POST "$REGISTRY_URL/v1/registrations" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d "$MANIFEST")
STATUS=$(response_status "$RESP")
if [[ "$STATUS" == "200" || "$STATUS" == "201" || "$STATUS" == "409" ]]; then
  pass "Re-registration detects conflict or is idempotent (HTTP $STATUS)"
else
  fail "Re-registration should return 200, 201, or 409 — got $STATUS"
fi

# ===========================================================================
# Phase 3: Application Queries — GET /v1/applications/:slug
# ===========================================================================
section "Phase 3: Application Queries"

RESP=$(http GET "$REGISTRY_URL/v1/applications/$TEST_SLUG" \
  -H "Authorization: Bearer $READ_TOKEN")
assert_status "GET /v1/applications/$TEST_SLUG returns 200" "200" "$RESP"
BODY=$(response_body "$RESP")
assert_json_field "Application slug matches" ".slug" "$TEST_SLUG" "$BODY"
assert_json_field "Application displayName present" "(.displayName // .display_name)" ".+" "$BODY"
assert_json_field "Application version matches" "(.version // .current_version)" "1.0.0" "$BODY"

RESP=$(http GET "$REGISTRY_URL/v1/applications/nonexistent-slug-xyz" \
  -H "Authorization: Bearer $READ_TOKEN")
assert_status "GET /v1/applications/:slug for unknown slug returns 404" "404" "$RESP"

# Version lookup
RESP=$(http GET "$REGISTRY_URL/v1/applications/$TEST_SLUG/versions" \
  -H "Authorization: Bearer $READ_TOKEN")
STATUS=$(response_status "$RESP")
if [[ "$STATUS" == "200" || "$STATUS" == "404" ]]; then
  pass "GET /v1/applications/$TEST_SLUG/versions returns $STATUS (acceptable)"
else
  fail "GET /v1/applications/$TEST_SLUG/versions — unexpected $STATUS"
fi

# ===========================================================================
# Phase 4: Metadata Query — GET /v1/applications/:slug/metadata
# ===========================================================================
section "Phase 4: Metadata Query"

RESP=$(http GET "$REGISTRY_URL/v1/applications/$TEST_SLUG/metadata" \
  -H "Authorization: Bearer $READ_TOKEN")
assert_status "GET /v1/applications/$TEST_SLUG/metadata returns 200" "200" "$RESP"
BODY=$(response_body "$RESP")
assert_json_field "Metadata contains modules" ".modules | length" "[^0]" "$BODY"
assert_json_field "Metadata contains resources" ".resources | length" "[^0]" "$BODY"
assert_json_field "Metadata contains actions" ".actions | length" "[^0]" "$BODY"
assert_json_field "Metadata contains navigation" ".navigation | length" "[^0]" "$BODY"

# ===========================================================================
# Phase 5: Catalog Queries — GET /v1/catalog/:category
# ===========================================================================
section "Phase 5: Catalog Queries"

for CATEGORY in workflow event integration setting feature widget localization; do
  RESP=$(http GET "$REGISTRY_URL/v1/catalog/$CATEGORY" \
    -H "Authorization: Bearer $READ_TOKEN")
  assert_status "GET /v1/catalog/$CATEGORY returns 200" "200" "$RESP"
done

# Catalog filtered by application
RESP=$(http GET "$REGISTRY_URL/v1/catalog/workflow?application=$TEST_SLUG" \
  -H "Authorization: Bearer $READ_TOKEN")
assert_status "GET /v1/catalog/workflow?application=$TEST_SLUG returns 200" "200" "$RESP"
BODY=$(response_body "$RESP")
assert_json_field "Workflow catalog contains at least 1 item" ". | length" "[^0]" "$BODY"

# ===========================================================================
# Phase 6: Route Resolution — GET /v1/routes/resolve
# ===========================================================================
section "Phase 6: Route Resolution"

RESP=$(http GET "$REGISTRY_URL/v1/routes/resolve?method=GET&path=/api/e2e/items" \
  -H "Authorization: Bearer $ROUTE_TOKEN")
assert_status "GET /v1/routes/resolve for known route returns 200" "200" "$RESP"
BODY=$(response_body "$RESP")
assert_json_field "Route resolution returns upstream" ".upstream" ".+" "$BODY"
assert_json_field "Route resolution returns audience" ".audience" ".+" "$BODY"

RESP=$(http GET "$REGISTRY_URL/v1/routes/resolve?method=GET&path=/api/unknown-service/xyz" \
  -H "Authorization: Bearer $ROUTE_TOKEN")
assert_status "GET /v1/routes/resolve for unknown route returns 404" "404" "$RESP"

RESP=$(http GET "$REGISTRY_URL/v1/routes/resolve?method=DELETE&path=/api/e2e/items" \
  -H "Authorization: Bearer $ROUTE_TOKEN")
assert_status "GET /v1/routes/resolve with unregistered method returns 404" "404" "$RESP"

# ===========================================================================
# Phase 7: Security Perimeter Tests
# ===========================================================================
section "Phase 7: Security Perimeter"

# 7.1 — Unauthenticated request
RESP=$(http GET "$REGISTRY_URL/v1/applications/e2e-test-app")
assert_status "Unauthenticated GET /v1/applications/:slug returns 401" "401" "$RESP"

# 7.2 — Unauthenticated registration
RESP=$(http POST "$REGISTRY_URL/v1/registrations" \
  -H "Content-Type: application/json" \
  -d "$MANIFEST")
assert_status "Unauthenticated POST /v1/registrations returns 401" "401" "$RESP"

# 7.3 — Malformed Bearer token
RESP=$(http GET "$REGISTRY_URL/v1/applications/e2e-test-app" \
  -H "Authorization: Bearer not.a.real.jwt")
assert_status "Malformed Bearer token returns 401" "401" "$RESP"

# 7.4 — Missing required fields in manifest (validation error)
RESP=$(http POST "$REGISTRY_URL/v1/registrations" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{"displayName": "Missing slug and version"}')
assert_status "POST /v1/registrations with missing slug returns 400" "400" "$RESP"

# 7.5 — Invalid slug format
RESP=$(http POST "$REGISTRY_URL/v1/registrations" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{"slug": "Invalid Slug With Spaces!", "displayName": "Bad Slug", "version": "1.0.0"}')
assert_status "POST /v1/registrations with invalid slug format returns 400" "400" "$RESP"

# 7.6 — Missing method/path parameters on route resolution
RESP=$(http GET "$REGISTRY_URL/v1/routes/resolve" \
  -H "Authorization: Bearer $ROUTE_TOKEN")
assert_status "GET /v1/routes/resolve missing params returns 400" "400" "$RESP"

# ===========================================================================
# Summary
# ===========================================================================
echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}Registry E2E Test Results${RESET}"
echo -e "  ${GREEN}Passed: $PASS${RESET}"
if [[ $FAIL -gt 0 ]]; then
  echo -e "  ${RED}Failed: $FAIL${RESET}"
  echo -e "\n${RED}${BOLD}FAIL — $FAIL test(s) did not pass.${RESET}"
  exit 1
else
  echo -e "  ${GREEN}Failed: 0${RESET}"
  echo -e "\n${GREEN}${BOLD}ALL TESTS PASSED ✔${RESET}"
  exit 0
fi

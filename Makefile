# =============================================================================
# Figentra workspace Makefile
# =============================================================================
#
# This root Makefile is the operator entry point for local development,
# Terraform, Docker, validation, and repository-wide automation.
#
# The Makefile deliberately delegates concern-specific targets to:
#   infrastructure/terraform/terraform.mk
#   infrastructure/docker/docker.mk
#
# Secrets are never stored in Makefiles. Runtime secrets are supplied by
# Doppler/CI/Cloudflare/Supabase according to the environment contract.
# =============================================================================

SHELL := /bin/bash
MAKEFLAGS += --no-print-directory

.DEFAULT_GOAL := help

ROOT := $(CURDIR)
TF_MK := infrastructure/terraform/terraform.mk
DOCKER_MK := infrastructure/docker/docker.mk

include $(TF_MK)
include $(DOCKER_MK)

.PHONY: help doctor bootstrap install build dev test lint typecheck format docs-check \
        catalog infra-generate docker-generate clean

help: ## Show the Figentra operator command list
	@printf '\033[1mFigentra Platform\033[0m\n\n'
	@awk 'BEGIN{FS=":.*## "}/^[a-zA-Z0-9_.-]+:.*## /{printf "  \033[36m%-28s\033[0m %s\n",$$1,$$2}' $(MAKEFILE_LIST)

doctor: ## Check required local tooling
	@printf '\033[1mToolchain\033[0m\n'
	@command -v node >/dev/null && node --version || true
	@command -v pnpm >/dev/null && pnpm --version || true
	@command -v terraform >/dev/null && terraform version | head -1 || true
	@command -v docker >/dev/null && docker --version || true
	@command -v doppler >/dev/null && doppler --version || true
	@printf '\n\033[1mRepository\033[0m\n'
	@node -e 'const p=require("./package.json"); console.log("package:",p.name); console.log("manager:",p.packageManager); console.log("node:",p.engines && p.engines.node)'

bootstrap: ## Bootstrap dependencies and repository tooling
	@pnpm install --frozen-lockfile

install: bootstrap ## Alias for bootstrap

build: ## Build all deployable projects through Turbo
	@pnpm turbo run build

dev: ## Start the local development graph
	@pnpm run dev

test: ## Run repository tests
	@pnpm turbo run test

lint: ## Run repository linting
	@pnpm turbo run lint

typecheck: ## Run TypeScript checks
	@pnpm turbo run check-types

format: ## Format repository source
	@pnpm run format

docs-check: ## Validate public-code documentation requirements
	@pnpm run docs:check

catalog: ## Collect only explicitly enrolled cloud.yaml sources into the deployment catalog
	@pnpm run catalog

docker-generate: ## Generate the local Docker Compose file from the explicit cloud.yaml paths
	@make -C infrastructure/docker compose ENV=$${ENV:-development}

clean: ## Remove generated build/test artifacts
	@pnpm turbo run clean
	@rm -rf infrastructure/terraform/.plans

# --- Enterprise security / production readiness -----------------------------

s2s-check: ## Validate shared service-to-service contracts
	@pnpm run messaging:check

nats-check: ## Validate NATS service-to-service contract files
	@pnpm run messaging:check

outbox-test: ## Run transactional outbox tests
	@pnpm --filter @figentra/outbox test

security-check: ## Run static security checks and documentation gates
	@pnpm run docs:check
	@pnpm run messaging:check

load-test-gateway: ## Run Gateway k6 load test (BASE_URL required)
	@test -n "$(BASE_URL)" || (printf 'BASE_URL= is required\n'; exit 1)
	@k6 run infrastructure/tests/load/gateway.js --env BASE_URL=$(BASE_URL)

load-test-registry: ## Run Registry k6 load test (BASE_URL required)
	@test -n "$(BASE_URL)" || (printf 'BASE_URL= is required\n'; exit 1)
	@k6 run infrastructure/tests/load/registry.js --env BASE_URL=$(BASE_URL)

security-dast: ## Run OWASP ZAP baseline against BASE_URL (explicitly opt-in)
	@test -n "$(BASE_URL)" || (printf 'BASE_URL= is required\n'; exit 1)
	@docker run --rm -t -v "$(CURDIR)/infrastructure/tests/security:/zap/wrk/:rw" ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t $(BASE_URL) -r zap-report.html

production-readiness: ## Validate the repository-level production readiness gates
	@pnpm run docs:check
	@pnpm run messaging:check
	@pnpm run infra:check
	@pnpm run catalog
	@make -C infrastructure/docker compose-validate ENV=development
	@terraform -chdir=infrastructure/terraform fmt -check -recursive
	@terraform -chdir=infrastructure/terraform validate
	@docker compose -f infrastructure/docker/docker-compose.generated.yml config

# Validate Gateway and Registry production contracts.
workers-check:
	pnpm run workers:check

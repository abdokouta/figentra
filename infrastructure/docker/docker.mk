# =============================================================================
# Docker infrastructure operator targets.
# @file infrastructure/docker/docker.mk
# @description Canonical local Compose generation and validation.
#
# Docker Compose is a local/integration runtime. Production compute and durable
# infrastructure remain Terraform/provider-owned.
#
# Generated artefacts live under infrastructure/.generated/ — machine-owned,
# gitignored, regenerated on demand. Never hand-edit the compose file.
# =============================================================================

ENV ?= development
VALID_ENVS := development staging production
COMPOSE_FILE := infrastructure/.generated/docker-compose.yml

ifeq ($(filter $(ENV),$(VALID_ENVS)),)
$(error ENV must be one of: $(VALID_ENVS))
endif

.PHONY: compose compose-validate compose-config compose-up compose-down compose-pull

compose: ## Generate Compose from the canonical deployment catalog
	@pnpm run catalog
	@node infrastructure/docker/scripts/generate-compose.mjs --environment=$(ENV)

compose-validate: compose ## Validate generated Compose
	@node infrastructure/docker/scripts/validate-compose.mjs

compose-config: compose-validate ## Ask Docker Compose to parse the generated topology
	@docker compose -f $(COMPOSE_FILE) config >/dev/null

compose-up: compose-config ## Start the selected local topology
	@docker compose -f $(COMPOSE_FILE) --profile infra up --build -d

compose-down: ## Stop the local topology
	@docker compose -f $(COMPOSE_FILE) down --remove-orphans

compose-pull: ## Pull infrastructure dependency images
	@docker compose -f $(COMPOSE_FILE) --profile infra pull

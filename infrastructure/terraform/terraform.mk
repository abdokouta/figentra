# =============================================================================
# infrastructure/terraform/terraform.mk
# =============================================================================
#
# Terraform lifecycle for Figentra.
#
# Environment model:
#   development / staging / production
#
# Only development, staging, and production are accepted; no short aliases are canonical or accepted.
#
# State model:
#   The environment root is the long-term boundary. The current migration keeps
#   a parent root available for adoption. Do not destroy production without an
#   explicit confirmation token.
#
# The environment files are intentionally committed and contain only provider,
# variable, and composition configuration. Secrets come from environment/secret
# managers, never from Terraform source.
# =============================================================================

TF ?= terraform
TF_DIR ?= infrastructure/terraform
ENV ?= development

# Normalize interactive aliases without making them canonical environment names.
PLAN_DIR := $(TF_DIR)/.plans

VALID_ENVS := development staging production
CONFIRM ?=

ifeq ($(filter $(ENV),$(VALID_ENVS)),)
$(error ENV must be one of: $(VALID_ENVS))
endif

.PHONY: tf-init tf-validate tf-fmt tf-plan tf-apply tf-apply-plan tf-destroy \
        tf-state-list tf-workspace-list tf-clean

tf-init: ## Initialize the selected Terraform environment
	@$(TF) -chdir=$(TF_DIR) init

tf-select: tf-init ## Select the canonical Terraform workspace
	@$(TF) -chdir=$(TF_DIR) workspace select $(ENV) >/dev/null 2>&1 || $(TF) -chdir=$(TF_DIR) workspace new $(ENV)

tf-validate: tf-select ## Validate Terraform configuration
	@$(TF) -chdir=$(TF_DIR) validate

tf-fmt: ## Format all Terraform
	@$(TF) fmt -recursive $(TF_DIR)

tf-plan: tf-select ## Create a saved plan for ENV
	@mkdir -p $(PLAN_DIR)
	@$(TF) -chdir=$(TF_DIR) plan -out=.plans/tfplan-$(ENV)

tf-apply: tf-select ## Apply the previously saved ENV plan
	@if [ ! -f "$(PLAN_DIR)/tfplan-$(ENV)" ]; then \
	  echo "ERROR: $(PLAN_DIR)/tfplan-$(ENV) does not exist; run make tf-plan ENV=$(ENV)"; exit 1; \
	fi
	@if [ "$(ENV)" = "production" ] && [ "$(CONFIRM)" != "yes-apply-production" ]; then \
	  echo "REFUSED: production apply requires CONFIRM=yes-apply-production"; exit 1; \
	fi
	@$(TF) -chdir=$(TF_DIR) apply .plans/tfplan-$(ENV)

tf-apply-plan: tf-apply ## Alias for applying the saved plan

tf-destroy: tf-select ## Destroy selected environment; production requires explicit confirmation
	@if [ "$(ENV)" = "production" ] && [ "$(CONFIRM)" != "yes-destroy-production" ]; then \
	  echo "REFUSED: production destroy requires CONFIRM=yes-destroy-production"; exit 1; \
	fi
	@$(TF) -chdir=$(TF_DIR) destroy

tf-state-list: tf-select ## List state resources for ENV
	@$(TF) -chdir=$(TF_DIR) state list

tf-workspace-list: ## List Terraform workspaces in the canonical root
	@$(TF) -chdir=$(TF_DIR) workspace list

tf-clean: ## Remove local Terraform working data and saved plans
	@rm -rf $(TF_DIR)/.plans
	@find $(TF_DIR) -type d -name .terraform -prune -exec rm -rf {} +

plan: tf-plan ## Short alias
apply: tf-apply ## Short alias
destroy: tf-destroy ## Short alias
validate: tf-validate ## Short alias

# --- Figentra generated Worker bindings -------------------------------------

wrangler-bindings: ## Render Terraform-produced D1/KV/RateLimit IDs into Worker config (WORKER=registry|orchestrator ENV=development|staging|production)
	@test -n "$(WORKER)" || (printf "WORKER= is required (registry|infrastructure-orchestrator)\n"; exit 1)
	@test -n "$(ENV)" || (printf "ENV= is required (development|staging|production)\n"; exit 1)
	@node infrastructure/terraform/scripts/render-wrangler-bindings.mjs --worker $(WORKER) --env $(ENV)

nats-plan: ## Plan NATS JetStream resources after NATS endpoint/credentials are supplied
	@$(MAKE) tf-plan ENV=$(ENV)

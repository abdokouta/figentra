# =============================================================================
# infrastructure/infrastructure.mk
# =============================================================================
#
# Single-include point for every infrastructure Make target. The root Makefile
# includes THIS file; this file in turn includes the per-concern subsystem
# Make files (Terraform + Docker). Adding a new infrastructure concern (a
# fourth subsystem — say Wrangler or Pulumi) means:
#
#   1. Author `infrastructure/<name>/<name>.mk`.
#   2. Add ONE include line here.
#
# Root `Makefile` never grows a second `include` — every route lands through
# this file. See `.kiro/steering/documentation.md` for the docblock convention.
#
# @security No secrets. Every subsystem defers secret resolution to Doppler
#   per `.kiro/steering/doppler.md`.
# =============================================================================

# ROOT is defined by the includer (root Makefile). Fall back to CURDIR when
# this file is invoked directly (e.g. `make -f infrastructure/infrastructure.mk`).
ROOT ?= $(CURDIR)

# Terraform — durable cloud infrastructure. Runs one canonical Terraform root
# with per-environment workspaces (development / staging / production).
INFRA_TF_MK := $(ROOT)/infrastructure/terraform/terraform.mk

# Docker — local/integration container topology. Generates a machine-owned
# compose file under infrastructure/.generated/docker-compose.yml.
INFRA_DOCKER_MK := $(ROOT)/infrastructure/docker/docker.mk

include $(INFRA_TF_MK)
include $(INFRA_DOCKER_MK)

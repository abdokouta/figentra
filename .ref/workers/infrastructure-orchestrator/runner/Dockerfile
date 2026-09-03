# =============================================================================
# @file workers/infrastructure-orchestrator/runner/Dockerfile
# @description Isolated Terraform execution image.
#
# The image contains Terraform and Git. It is never exposed as a public HTTP
# service. The Worker starts the container and invokes one fixed entrypoint.
# =============================================================================
FROM hashicorp/terraform:1.16.0

RUN apk add --no-cache git ca-certificates openssh-client

WORKDIR /workspace
COPY entrypoint.sh /entrypoint.sh
RUN chmod 0755 /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

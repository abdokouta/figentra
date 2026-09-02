#!/bin/sh
# =============================================================================
# @file entrypoint.sh
# @description Fixed Terraform execution program.
#
# Security: no arbitrary shell command is accepted. Repository, revision,
# environment, operation and workspace are validated before Terraform runs.
# Provider/state credentials are runtime secrets and never committed.
# =============================================================================
set -eu

: "${FIGENTRA_JOB_ID:?missing job id}"
: "${FIGENTRA_ENVIRONMENT:?missing environment}"
: "${FIGENTRA_TERRAFORM_OPERATION:?missing operation}"
: "${FIGENTRA_TERRAFORM_REVISION:?missing revision}"
: "${FIGENTRA_TERRAFORM_WORKSPACE:?missing workspace}"
: "${FIGENTRA_APPROVAL_REF:?missing approval ref variable}"
: "${FIGENTRA_TERRAFORM_REPOSITORY:?missing repository}"
: "${FIGENTRA_TERRAFORM_GIT_TOKEN:?missing git token}"

case "$FIGENTRA_TERRAFORM_OPERATION" in
  plan|apply|destroy) ;;
  *) echo "unsupported terraform operation" >&2; exit 64 ;;
esac

case "$FIGENTRA_ENVIRONMENT" in
  development|staging|production) ;;
  *) echo "unsupported environment" >&2; exit 64 ;;
esac

if [ "$FIGENTRA_TERRAFORM_WORKSPACE" != "$FIGENTRA_ENVIRONMENT" ]; then
  echo "terraform workspace must match environment" >&2
  exit 64
fi

if [ "$FIGENTRA_ENVIRONMENT" != "development" ] && [ "$FIGENTRA_TERRAFORM_OPERATION" != "plan" ] && [ -z "$FIGENTRA_APPROVAL_REF" ]; then
  echo "production mutation requires an approval reference" >&2
  exit 64
fi

case "$FIGENTRA_TERRAFORM_WORKSPACE" in
  *[!a-zA-Z0-9_-]*|"") echo "invalid terraform workspace" >&2; exit 64 ;;
esac

rm -rf /workspace/repository
mkdir -p /workspace/repository
cd /workspace/repository

# Fetch exactly one immutable revision. The token is supplied through the
# runtime environment and is never written to the clone URL or logs.
git init -q
git remote add origin "https://github.com/${FIGENTRA_TERRAFORM_REPOSITORY}.git"
git -c http.extraHeader="Authorization: Bearer ${FIGENTRA_TERRAFORM_GIT_TOKEN}" fetch --depth 1 origin "$FIGENTRA_TERRAFORM_REVISION"
git checkout -q --detach FETCH_HEAD

# The source token is needed only for the immutable Git fetch. Never expose it
# to Terraform providers or child processes after checkout.
unset FIGENTRA_TERRAFORM_GIT_TOKEN

cd infrastructure/terraform

terraform init -input=false -no-color
terraform workspace select "$FIGENTRA_TERRAFORM_WORKSPACE" 2>/dev/null || terraform workspace new "$FIGENTRA_TERRAFORM_WORKSPACE"

case "$FIGENTRA_TERRAFORM_OPERATION" in
  plan)
    terraform plan -input=false -no-color -out="/tmp/${FIGENTRA_JOB_ID}.tfplan"
    ;;
  apply)
    terraform plan -input=false -no-color -out="/tmp/${FIGENTRA_JOB_ID}.tfplan"
    terraform apply -input=false -no-color "/tmp/${FIGENTRA_JOB_ID}.tfplan"
    ;;
  destroy)
    terraform plan -destroy -input=false -no-color -out="/tmp/${FIGENTRA_JOB_ID}.tfplan"
    terraform apply -input=false -no-color "/tmp/${FIGENTRA_JOB_ID}.tfplan"
    ;;
esac

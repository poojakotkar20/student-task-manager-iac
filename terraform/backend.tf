# ==============================================================================
# Remote State Configuration (CI/CD & Team Collaboration)
# Project: Automated Serverless Student Task Management IaC
# ==============================================================================
#
# CRITICAL TERRAFORM STATE REQUIREMENT:
# GitHub-hosted runners are ephemeral. If local state (terraform.tfstate) is used
# on a runner, it is destroyed when the runner shuts down. Subsequent workflow runs
# will start with a blank state and attempt duplicate resource creation.
#
# RECOMMENDED FREE REMOTE BACKENDS:
#
# Option A (Recommended): Cloudflare R2 (100% Free, Native S3-Compatible Storage)
# ------------------------------------------------------------------------------
# Cloudflare offers 10 GB/month of free R2 storage. Because R2 is S3-compatible,
# Terraform's built-in "s3" backend connects to it without extra tools.
#
# Setup Steps for Cloudflare R2 Backend:
# 1. In Cloudflare Dashboard, go to R2 Object Storage -> Create bucket named "tf-state-student-tasks".
# 2. In R2 -> Manage R2 API Tokens -> Create API Token with "Object Read & Write" permissions.
# 3. Copy the Access Key ID and Secret Access Key.
# 4. Uncomment the block below and replace <YOUR_ACCOUNT_ID> with your Cloudflare Account ID:
#
# terraform {
#   backend "s3" {
#     bucket                      = "tf-state-student-tasks"
#     key                         = "student-task-manager/terraform.tfstate"
#     region                      = "auto"
#     endpoint                    = "https://<YOUR_ACCOUNT_ID>.r2.cloudflarestorage.com"
#     skip_credentials_validation = true
#     skip_region_validation      = true
#     skip_requesting_account_id  = true
#     skip_s3_checksum            = true
#   }
# }
#
# Required GitHub Secrets for R2 Backend:
#   - AWS_ACCESS_KEY_ID: <R2 Token Access Key ID>
#   - AWS_SECRET_ACCESS_KEY: <R2 Token Secret Access Key>
#
# Option B: HCP Terraform / Terraform Cloud (Free tier up to 500 resources)
# ------------------------------------------------------------------------------
# 1. Create a free account at https://app.terraform.io
# 2. Create an Organization (e.g. "my-college-projects") and Workspace ("student-tasks-dev").
# 3. In Workspace Settings -> Execution Mode, select "Local" or "Remote".
# 4. Uncomment the block below:
#
# terraform {
#   cloud {
#     organization = "YOUR_ORGANIZATION_NAME"
#     workspaces {
#       name = "student-tasks-dev"
#     }
#   }
# }
#
# Required GitHub Secret for Terraform Cloud:
#   - TF_API_TOKEN: <Terraform Cloud User/Team API Token>
#
# ==============================================================================
# NOTE FOR LOCAL EVALUATION / VIVA:
# When demonstrating locally on your machine, Terraform uses local state (terraform.tfstate)
# by default, which is saved locally and ignored by .gitignore.
# ==============================================================================

# ==============================================================================
# Input Variables: Cloudflare Serverless Student Task Manager IaC
# ==============================================================================

variable "cloudflare_api_token" {
  description = "Cloudflare API Token with Workers Scripts (Edit) and Workers KV Storage (Edit) permissions. Can be set via terraform.tfvars, TF_VAR_cloudflare_api_token, or CLOUDFLARE_API_TOKEN environment variable."
  type        = string
  sensitive   = true
  default     = null
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID (found on Cloudflare Dashboard: Overview / Workers & Pages). Can be set via terraform.tfvars or TF_VAR_cloudflare_account_id."
  type        = string
}

variable "environment" {
  description = "Deployment environment stage (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "worker_name" {
  description = "Base name for the Cloudflare Worker script"
  type        = string
  default     = "student-task-manager"
}

variable "compatibility_date" {
  description = "Cloudflare Worker runtime compatibility date (YYYY-MM-DD)"
  type        = string
  default     = "2024-09-23"
}

variable "tags" {
  description = "Resource tags assigned to the Cloudflare Worker script"
  type        = list(string)
  default     = ["student-tasks", "iac-managed"]
}

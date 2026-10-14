# Input Variables for Cloudflare Infrastructure as Code (IaC)

variable "cloudflare_api_token" {
  description = "Cloudflare API Token with Workers Scripts (Edit) and Workers KV Storage (Edit) permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID (available on Cloudflare Dashboard under Workers & Pages / Overview)"
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

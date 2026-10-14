# Terraform Provider Configuration for Cloudflare
# Project: Automated Deployment of Serverless Student Task Management Application

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.45.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

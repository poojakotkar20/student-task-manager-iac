# ==============================================================================
# Outputs: Cloudflare Serverless Infrastructure
# ==============================================================================

output "kv_namespace_id" {
  description = "Unique Identifier of the created Cloudflare Workers KV Namespace"
  value       = cloudflare_workers_kv_namespace.tasks_kv.id
}

output "kv_namespace_title" {
  description = "Title of the created Workers KV Namespace"
  value       = cloudflare_workers_kv_namespace.tasks_kv.title
}

output "worker_script_name" {
  description = "Name of the deployed Cloudflare Worker script"
  value       = cloudflare_workers_script.task_manager.name
}

output "worker_compatibility_date" {
  description = "Worker runtime compatibility date"
  value       = cloudflare_workers_script.task_manager.compatibility_date
}

output "worker_tags" {
  description = "Tags applied to the Worker script"
  value       = cloudflare_workers_script.task_manager.tags
}

output "application_url_format" {
  description = "URL pattern where the application and REST API can be accessed"
  value       = "https://${cloudflare_workers_script.task_manager.name}.<your-cloudflare-subdomain>.workers.dev"
}

output "api_tasks_endpoint_format" {
  description = "Direct REST API endpoint format for student tasks"
  value       = "https://${cloudflare_workers_script.task_manager.name}.<your-cloudflare-subdomain>.workers.dev/api/tasks"
}

output "live_application_url" {
  description = "Exact live application URL on Cloudflare Workers"
  value       = "https://${cloudflare_workers_script.task_manager.name}.poojakotkar2024.workers.dev"
}

output "live_api_endpoint" {
  description = "Exact live REST API endpoint on Cloudflare Workers"
  value       = "https://${cloudflare_workers_script.task_manager.name}.poojakotkar2024.workers.dev/api/tasks"
}

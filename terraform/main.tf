# ==============================================================================
# Infrastructure Definition: Cloudflare Serverless Student Task Manager
# Resources: Cloudflare Workers KV Namespace, Worker Script, and KV Namespace Binding
# ==============================================================================

# 1. Provision Cloudflare Workers KV Namespace for persistent storage of student tasks
resource "cloudflare_workers_kv_namespace" "tasks_kv" {
  account_id = var.cloudflare_account_id
  title      = "${var.environment}-student-tasks-kv"
}

# 2. Local variables to read and bundle frontend assets directly into the Worker script
locals {
  html_source = file("${path.module}/../application/index.html")
  css_source  = file("${path.module}/../application/style.css")
  js_source   = file("${path.module}/../application/script.js")

  worker_template = file("${path.module}/../application/worker.js")

  # Replace placeholder strings with safely JSON-encoded frontend code
  worker_script_content = replace(
    replace(
      replace(
        local.worker_template,
        "\"__EMBEDDED_HTML__\"",
        jsonencode(local.html_source)
      ),
      "\"__EMBEDDED_CSS__\"",
      jsonencode(local.css_source)
    ),
    "\"__EMBEDDED_JS__\"",
    jsonencode(local.js_source)
  )
}

# 3. Provision Cloudflare Worker Script with KV Binding
resource "cloudflare_workers_script" "task_manager" {
  account_id         = var.cloudflare_account_id
  name               = "${var.worker_name}-${var.environment}"
  content            = local.worker_script_content
  compatibility_date = var.compatibility_date
  module             = true
  tags               = var.tags

  # Worker-to-KV Binding: Makes KV namespace accessible in Worker code via env.TASKS_KV
  kv_namespace_binding {
    name         = "TASKS_KV"
    namespace_id = cloudflare_workers_kv_namespace.tasks_kv.id
  }
}

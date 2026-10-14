# Project Screenshots Guide (College Evaluation / Viva)

Save your project demonstration screenshots in this folder to present in your viva / project report.

## Suggested Screenshots Checklist:

| File Name | Description |
| :--- | :--- |
| `01_terraform_init_validate.png` | Terminal showing `terraform init` and `terraform validate` passing. |
| `02_terraform_plan.png` | Terminal showing `terraform plan` (provisions Worker, KV, and Binding). |
| `03_terraform_apply.png` | Terminal showing `terraform apply` success with generated output values. |
| `04_cloudflare_dashboard_worker.png` | Cloudflare Dashboard under **Workers & Pages** showing the Worker created by Terraform. |
| `05_cloudflare_dashboard_kv.png` | Cloudflare Dashboard under **Workers & Pages > KV** showing persistent task keys. |
| `06_web_app_dashboard.png` | Web application running in browser with student tasks, metrics, and filter bar. |
| `07_rest_api_curl.png` | Terminal testing REST API endpoints (`GET /api/tasks`, `POST /api/tasks`). |
| `08_github_actions_ci_cd.png` | GitHub Actions workflow execution showing automated linting, plan, and deployment. |
| `09_terraform_destroy.png` | Terminal showing clean teardown of infrastructure via `terraform destroy`. |

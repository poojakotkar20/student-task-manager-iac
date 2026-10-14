# Project Evaluation Screenshots Checklist

This directory contains the visual evidence required for the college mini-project evaluation and viva report for:
**Automated Deployment of a Serverless Student Task Management Application Using Terraform-Based Infrastructure as Code**

> [!IMPORTANT]
> Capture each of the 17 screenshots listed below in the **exact specified order**. Do not fabricate or mock screenshots; capture real terminal and browser outputs using your system.

---

## Evaluation Screenshots (Ordered 1 to 17)

| # | Filename | Screenshot Description & What to Capture |
| :-: | :--- | :--- |
| **1** | `01_project_folder_structure.png` | **Project folder structure**: File explorer / VS Code showing `application/`, `terraform/`, `.github/workflows/`, `screenshots/`, and root files. |
| **2** | `02_working_application_dashboard.png` | **Working application with tasks displayed**: Web browser at `http://localhost:3000` or deployed Worker URL with active tasks, KPI metric counters, and priority badges. |
| **3** | `03_task_crud_operations.png` | **Successful task creation, status update, and deletion**: Application interface showing a created task, changing status dropdown (`Pending` &rarr; `In Progress`), and task deletion. |
| **4** | `04_terraform_init_validate.png` | **`terraform init` and `terraform validate`**: Terminal output showing provider initialization and `Success! The configuration is valid.` |
| **5** | `05_terraform_plan_initial.png` | **Initial `terraform plan`**: Terminal output showing `Plan: 2 to add, 0 to change, 0 to destroy` (Worker script and KV namespace). |
| **6** | `06_terraform_apply_success.png` | **Successful `terraform apply`**: Terminal output showing resource creation and `Apply complete! Resources: 2 added, 0 changed, 0 destroyed.` |
| **7** | `07_terraform_outputs_worker_url.png` | **Terraform outputs showing deployed Worker URL**: Terminal output showing `application_url_format`, `kv_namespace_id`, and `worker_script_name`. |
| **8** | `08_cloudflare_dashboard_worker_kv.png` | **Cloudflare dashboard showing Worker and KV**: Cloudflare Dashboard under **Workers & Pages** showing `student-task-manager-dev` and under **KV** showing `dev-student-tasks-kv`. |
| **9** | `09_tasks_stored_in_kv_evidence.png` | **Evidence of tasks stored in KV via deployed app**: Cloudflare Dashboard &rarr; **Workers & Pages > KV** &rarr; `dev-student-tasks-kv` &rarr; View Keys showing persistent task keys. |
| **10** | `10_terraform_plan_modification.png` | **Terraform plan showing an infrastructure modification**: Terminal showing `terraform plan` after modifying `tags` or `compatibility_date`, highlighting `~ update in-place`. |
| **11** | `11_terraform_apply_modification.png` | **Successful application of the modification**: Terminal showing `terraform apply` completed with `Resources: 0 added, 1 changed, 0 destroyed.` |
| **12** | `12_github_repository_code.png` | **GitHub repository containing source code**: Web browser showing GitHub repository page with all commit history, code structure, and `README.md`. |
| **13** | `13_github_actions_workflow_run.png` | **GitHub Actions workflow run**: GitHub Actions tab showing automated run with green checkmarks across formatting, init, validate, plan, and apply. |
| **14** | `14_terraform_plan_destroy.png` | **`terraform plan -destroy`**: Terminal showing speculative destroy plan: `Plan: 0 to add, 0 to change, 2 to destroy.` |
| **15** | `15_terraform_destroy_verified.png` | **Successful `terraform destroy` and resource removal**: Terminal showing `Destroy complete! Resources: 2 destroyed.` followed by empty `terraform show`. |
| **16** | `16_terraform_recreate_apply.png` | **Successful recreation using plan and apply**: Terminal showing subsequent `terraform apply` recreating both resources (`2 added, 0 changed, 0 destroyed`). |
| **17** | `17_working_app_after_recreation.png` | **Working application after recreation**: Web browser showing the freshly recreated Worker URL loading the functional application with newly added task. |

---

## Video Walkthroughs in this Folder
- `app_demo_walkthrough.webp`: Recorded demonstration of UI features, dark-theme dashboard, and modal inspectors.
- `crud_operations_test.webp`: End-to-end browser recording testing task creation, priority assignment, status dropdown modification, and deletion.

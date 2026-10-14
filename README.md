# Automated Deployment of a Serverless Student Task Management Application Using Terraform-Based Infrastructure as Code

[![Terraform](https://img.shields.io/badge/Terraform-v1.16+-623CE4?logo=terraform&logoColor=white)](https://www.terraform.io/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers%20%26%20KV-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![CI/CD](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-2088FF?logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![License](https://img.shields.io/badge/Academic-College%20Mini--Project-10B981)](#)

---

## 1. Project Overview & Objectives

This project implements an automated, serverless **Student Task Management Application** provisioned entirely using **Terraform-Based Infrastructure as Code (IaC)** on the **Cloudflare Free tier**, integrated with **Git**, **GitHub**, and **GitHub Actions CI/CD**.

The primary academic and practical evaluation objective is **Infrastructure as Code (IaC)**: automating the provisioning, configuration, in-place modification, destruction, and recreation of cloud resources rather than relying on manual dashboard actions.

### Key Objectives:
1. **Infrastructure as Code (IaC)**: Terraform manages the Cloudflare Worker, KV namespace, and Worker-to-KV bindings declaratively.
2. **Serverless Architecture**: Cloudflare Workers executes serverless JavaScript at the edge with sub-50ms latency.
3. **Persistent Cloud Storage**: Distributed Cloudflare Workers KV stores and retrieves task records.
4. **Complete REST API Suite**: Implements `POST /api/tasks`, `GET /api/tasks`, `GET /api/tasks/{id}`, `PUT /api/tasks/{id}`, and `DELETE /api/tasks/{id}`.
5. **Continuous Deployment (CI/CD)**: GitHub Actions automates linting, provider initialization, validation, planning, and deployment.
6. **Zero-Trust Security**: No hardcoded API tokens, secrets, or state files in version control.

---

## 2. Architecture Explanation

```
                                    +------------------------------------------------+
                                    |                Web Browser (User)              |
                                    |          (Desktop / Tablet / Mobile)           |
                                    +------------------------------------------------+
                                                           |
                                      HTTPS Requests (GET /, /style.css, /script.js,
                                                      or /api/tasks)
                                                           v
                                    +------------------------------------------------+
                                    |         Cloudflare Edge Network                |
                                    |                                                |
                                    |   +----------------------------------------+   |
                                    |   |      Cloudflare Worker Script          |   |
                                    |   |     (student-task-manager-dev)         |   |
                                    |   |                                        |   |
                                    |   |  * Serves Embedded UI (HTML/CSS/JS)    |   |
                                    |   |  * Routes REST API Endpoints           |   |
                                    |   +----------------------------------------+   |
                                    |                      |                         |
                                    |           Worker-to-KV Binding                 |
                                    |              (env.TASKS_KV)                    |
                                    |                      v                         |
                                    |   +----------------------------------------+   |
                                    |   |      Cloudflare Workers KV Store       |   |
                                    |   |       (dev-student-tasks-kv)           |   |
                                    |   |                                        |   |
                                    |   |  * Persistent JSON task records        |   |
                                    |   |  * Keys: task:<task_id>                |   |
                                    |   +----------------------------------------+   |
                                    +------------------------------------------------+
                                                           ^
                                                           |
                                            Provisions, Updates, Destroys
                                                           |
                             +-----------------------------+-----------------------------+
                             |                                                           |
              +-------------------------------+                           +-------------------------------+
              |    Local Developer Machine    |                           |      GitHub Actions CI/CD     |
              |     (Terraform CLI v1.16)     |                           |    (Automated on Push: main)  |
              +-------------------------------+                           +-------------------------------+
```

### Technical Workflow:
1. **Frontend Request**: When a user accesses `https://student-task-manager-dev.<subdomain>.workers.dev/`, the Worker intercepts the request and serves the embedded `index.html`.
2. **Asset Loading**: The browser requests `/style.css` and `/script.js`, which the Worker serves with appropriate MIME types and cache headers.
3. **API Routing**: When the frontend performs CRUD actions, it issues `fetch('/api/tasks...')` to the same origin. The Worker parses the request, executes atomic CRUD actions on `env.TASKS_KV`, and returns structured JSON responses.

---

## 3. Technology Stack

* **Frontend**: Vanilla HTML5, CSS3 (Obsidian & Glassmorphism Design System), JavaScript (ES6+).
* **Backend**: JavaScript Cloudflare Worker using REST APIs (`fetch` handler).
* **Database/Storage**: Cloudflare Workers KV (distributed key-value store).
* **Infrastructure as Code (IaC)**: HashiCorp Terraform CLI v1.16+ with `cloudflare/cloudflare` provider `~> 4.45.0`.
* **Version Control**: Git and GitHub.
* **CI/CD Automation**: GitHub Actions (`.github/workflows/deploy.yml`).
* **Cloud Platform**: Cloudflare Free Plan.

---

## 4. Folder Structure

```
student-task-manager-iac/
├── application/
│   ├── index.html            # Semantic frontend dashboard with KPI cards and modals
│   ├── style.css             # Glassmorphism dark-theme design tokens and animations
│   ├── script.js             # Client logic, REST API calls, status dropdown, toasts
│   └── worker.js             # Serverless Cloudflare Worker code + REST API routes
├── terraform/
│   ├── providers.tf          # Terraform engine version & Cloudflare provider block
│   ├── main.tf               # Core IaC resources (Workers KV, Worker script, KV binding)
│   ├── variables.tf          # Input variable schemas, default values, and validations
│   ├── outputs.tf            # Output values (KV ID, script name, live URL formats)
│   ├── backend.tf            # Documentation & configuration guide for remote state
│   └── terraform.tfvars.example # Safe credential template with placeholders
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions CI/CD automated deployment workflow
├── screenshots/
│   ├── README.md             # Viva screenshot checklist and report guide
│   └── crud_operations_test.webp # Recorded end-to-end browser CRUD demonstration
├── .gitignore                # Protects secrets, credentials, state files, and logs
├── package.json              # Local testing scripts & helper commands
├── test-server.js            # Zero-dependency local mock server for immediate testing
└── README.md                 # Project documentation and evaluation guide
```

---

## 5. Prerequisites

Before running the project, verify that the following tools are installed:
* **Node.js**: v18+ or v22+ (`node -v`)
* **Git**: v2.40+ (`git --version`)
* **Terraform CLI**: v1.5+ or v1.16+ (`terraform -version`)

---

## 6. Cloudflare Authentication & Setup

You need a free Cloudflare account. Follow these one-time steps:

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. **Find Account ID**:
   * Click **Workers & Pages** in the left sidebar.
   * On the right-hand panel under **Account details**, click to copy your **Account ID**.
3. **Generate API Token**:
   * Click your user profile icon (top-right) &rarr; **My Profile** &rarr; **API Tokens**.
   * Click **Create Token** &rarr; select **Create Custom Token** &rarr; click **Get started**.
   * Token name: `student-task-manager-token`.
   * Under **Permissions**, add:
     * **Account** &bull; **Workers Scripts** &bull; **Edit**
     * **Account** &bull; **Workers KV Storage** &bull; **Edit**
     * **Account** &bull; **Account Settings** &bull; **Read**
   * Under **Account Resources**: select **Include** &bull; **All accounts**.
   * Click **Continue to summary** &rarr; **Create Token**, and copy the token.

---

## 7. Local Testing Instructions

You can run and test the complete application locally with zero external dependencies and simulated KV persistence:

```powershell
cd "d:\cc project2\student-task-manager-iac"
npm start
```

1. Open **`http://localhost:3000`** in your browser.
2. The UI starts in an empty state (no fake tasks).
3. Add a task with title and priority (`Low`, `Medium`, or `High`).
4. Change the status from `Pending` to `In Progress` using the dropdown on the card.
5. Click **Details** to inspect the server-generated task ID, timestamps, and JSON representation.
6. Click **Delete** to delete the task.

---

## 8. Terraform Lifecycle Commands

Run all Terraform commands from the `terraform/` directory:

```powershell
cd "d:\cc project2\student-task-manager-iac\terraform"
```

Create your private `terraform.tfvars` from the example:
```powershell
copy terraform.tfvars.example terraform.tfvars
```
Insert your actual Cloudflare credentials:
```hcl
cloudflare_account_id = "your_actual_account_id_here"
cloudflare_api_token  = "your_actual_api_token_here"
environment           = "dev"
worker_name           = "student-task-manager"
```

### Complete Lifecycle Execution:

```powershell
# Step 1: Initialize Provider Plugins
terraform init

# Step 2: Check Code Formatting
terraform fmt -check

# Step 3: Validate Syntax
terraform validate

# Step 4: Generate Execution Plan
terraform plan

# Step 5: Apply & Provision Infrastructure
terraform apply

# Step 6: Inspect Managed State
terraform show
```

---

## 9. Infrastructure Modification Example

To demonstrate Terraform's ability to update infrastructure declaratively:

1. Open `terraform/terraform.tfvars` and modify the `compatibility_date` or add a new tag:
   ```hcl
   compatibility_date = "2024-10-01"
   tags               = ["student-tasks", "iac-managed", "v2-modified"]
   ```
2. Run speculative plan:
   ```powershell
   terraform plan
   ```
   *Terraform detects the change and shows an in-place update:*
   `~ update in-place: tags, compatibility_date` (`0 to add, 1 to change, 0 to destroy`).
3. Apply the modification:
   ```powershell
   terraform apply
   ```

---

## 10. GitHub and GitHub Actions CI/CD Setup

### 1. Initialize and Push to GitHub:
```powershell
cd "d:\cc project2\student-task-manager-iac"
git remote add origin https://github.com/<YOUR_USERNAME>/student-task-manager-iac.git
git branch -M main
git push -u origin main
```

### 2. Configure GitHub Secrets:
1. In your GitHub repository, navigate to **Settings** &rarr; **Secrets and variables** &rarr; **Actions**.
2. Add **Secret 1**:
   * Name: `CLOUDFLARE_API_TOKEN`
   * Value: `<Your Cloudflare API Token>`
3. Add **Secret 2**:
   * Name: `CLOUDFLARE_ACCOUNT_ID`
   * Value: `<Your Cloudflare Account ID>`

### 3. Remote State Strategy in CI/CD:
Because GitHub Actions runners are ephemeral, successive runs need a shared state backend.
* **Recommended Free Option**: Cloudflare R2 (S3-compatible, 10 GB free tier). See [terraform/backend.tf](file:///d:/cc%20project2/student-task-manager-iac/terraform/backend.tf) for the exact `backend "s3"` block and instructions.
* For local development, Terraform defaults to local state (`terraform.tfstate`, ignored by Git).

---

## 11. Destroy and Recreate Procedure

To demonstrate complete infrastructure lifecycle teardown and recreation:

```powershell
# Step 1: Teardown Plan
terraform plan -destroy

# Step 2: Clean Destruction
terraform destroy -auto-approve

# Step 3: Verify Removal
terraform show

# Step 4: Recreate Clean Infrastructure
terraform plan
terraform apply -auto-approve
```

---

## 12. Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `Error: invalid value for api_token` | Token format mismatch | Ensure the token is 40 characters long and created with Custom Token permissions. |
| `HTTP 401: Unauthorized` | Insufficient token permissions | Verify the token includes `Workers Scripts: Edit`, `Workers KV: Edit`, and `Account Settings: Read`. |
| `HTTP 400: Invalid Account ID` | Account ID typo | Copy the 32-character hexadecimal Account ID from Cloudflare Dashboard &rarr; Workers & Pages. |
| `KV Binding 'TASKS_KV' missing` | Terraform apply was skipped | Run `terraform apply` so the `kv_namespace_binding` block binds the KV namespace to the script. |

---

## 13. Security Notes

* **Zero Hardcoded Secrets**: Secrets are never hardcoded in `.tf` files or committed to Git.
* **Sensitive Variables**: Variables containing credentials are typed with `sensitive = true` to suppress terminal printing.
* **Git Exclusions**: `.gitignore` strictly excludes `.tfvars`, `*.tfstate`, `.env`, and private keys.
* **Least Privilege**: GitHub Actions permissions are constrained to `contents: read`.

---

## 14. Screenshot Checklist for Viva / Project Report

| Filename | Content to Capture |
| :--- | :--- |
| `01_terraform_init_validate.png` | Terminal showing `terraform init` and `terraform validate` passing. |
| `02_terraform_plan.png` | Terminal showing `terraform plan` output (2 to add). |
| `03_terraform_apply.png` | Terminal showing `terraform apply` success with generated output values. |
| `04_cloudflare_dashboard_worker.png` | Cloudflare Dashboard &rarr; Workers & Pages showing `student-task-manager-dev`. |
| `05_cloudflare_dashboard_kv.png` | Cloudflare Dashboard &rarr; Workers & Pages &rarr; KV showing persistent task keys. |
| `06_web_app_dashboard.png` | Web application running with tasks, KPI metric counters, and status badges. |
| `07_task_details_inspector.png` | Modal showing task details and the raw Workers KV JSON representation. |
| `08_terraform_modify.png` | Terminal showing `terraform plan` with `~ update in-place`. |
| `09_github_actions_ci_cd.png` | GitHub Actions workflow execution showing green checkmarks. |
| `10_terraform_destroy.png` | Terminal showing clean teardown via `terraform destroy`. |

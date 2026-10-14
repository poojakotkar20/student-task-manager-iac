# Automated Deployment of a Serverless Student Task Management Application Using Terraform-Based Infrastructure as Code

[![Terraform](https://img.shields.io/badge/Terraform-v1.16+-623CE4?logo=terraform&logoColor=white)](https://www.terraform.io/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers%20%26%20KV-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![CI/CD](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-2088FF?logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![License](https://img.shields.io/badge/Academic-College%20Mini--Project-10B981)](#)

A college mini-project demonstrating the complete **Infrastructure as Code (IaC)** lifecycle using **HashiCorp Terraform** to provision, modify, destroy, and recreate a serverless **Student Task Management Application** on **Cloudflare Workers** and **Workers KV**, with automated **GitHub Actions CI/CD**.

---

## Table of Contents
1. [Introduction and Problem Statement](#1-introduction-and-problem-statement)
2. [Project Objectives](#2-project-objectives)
3. [Tools and Technologies Used](#3-tools-and-technologies-used)
4. [System Architecture and Request Flow](#4-system-architecture-and-request-flow)
5. [Application Functionality](#5-application-functionality)
6. [REST API Endpoint Table](#6-rest-api-endpoint-table)
7. [Cloudflare Workers and Workers KV Explanation](#7-cloudflare-workers-and-workers-kv-explanation)
8. [Terraform Files and Their Responsibilities](#8-terraform-files-and-their-responsibilities)
9. [Infrastructure Initialization, Validation, Planning, and Deployment](#9-infrastructure-initialization-validation-planning-and-deployment)
10. [Demonstration of an Infrastructure Modification and Subsequent Update](#10-demonstration-of-an-infrastructure-modification-and-subsequent-update)
11. [GitHub Repository and GitHub Actions CI/CD](#11-github-repository-and-github-actions-cicd)
12. [Terraform Destroy and Verification of Resource Removal](#12-terraform-destroy-and-verification-of-resource-removal)
13. [Recreation of the Infrastructure](#13-recreation-of-the-infrastructure)
14. [Results, Limitations, and Conclusion](#14-results-limitations-and-conclusion)
15. [Screenshot Checklist for Project Report and Viva](#15-screenshot-checklist-for-project-report-and-viva)
16. [Viva Preparation & Examiner Q&A](#16-viva-preparation--examiner-qa)

---

## 1. Introduction and Problem Statement

### Context
In traditional cloud software development, infrastructure such as servers, routing tables, and databases are provisioned manually using cloud vendor web dashboards. 

### Problem Statement
Configuring infrastructure through point-and-click graphical consoles leads to several operational failures:
- **Configuration Drift**: Environments diverge silently when ad-hoc changes are made directly in the console.
- **Human Error**: Missing a database binding or environment variable can break production without warning.
- **Zero Audit Trail**: Web dashboard clicks leave no commit log detailing who changed what, when, or why.
- **Slow Teardown and Rebuilding**: Teardown and recovery from failures is slow, manual, and unreliable.

### Proposed Solution
This project solves these issues by adopting **Infrastructure as Code (IaC)** via **HashiCorp Terraform**. The entire serverless cloud architecture—including compute (Cloudflare Workers), storage (Cloudflare Workers KV), and their secure inter-service connection (KV Binding)—is codified in declarative configuration files. This allows the complete infrastructure to be deployed, updated, destroyed, and rebuilt automatically within seconds.

---

## 2. Project Objectives

1. **Infrastructure as Code (IaC) Demonstration**: Manage 100% of the Cloudflare serverless footprint via Terraform without manual resource creation on the web dashboard.
2. **Serverless Edge Computing**: Implement a RESTful application backend using Cloudflare Workers running on Google V8 isolates at edge locations worldwide.
3. **Persistent Cloud Storage**: Utilize Cloudflare Workers KV to store and manage student task objects with unique keys.
4. **Complete Application Functionality**: Provide a clean, responsive student task dashboard in Vanilla HTML/CSS/JS with full CRUD capabilities.
5. **CI/CD Automation**: Implement a GitHub Actions workflow to automatically check formatting, initialize providers, validate syntax, plan infrastructure changes, and apply deployments.
6. **Security & Zero Secrets in Version Control**: Keep all API tokens and state files out of Git using `.gitignore`, Terraform sensitive variables, and GitHub Secrets.

---

## 3. Tools and Technologies Used

| Layer | Technology | Specification / Version | Role in Project |
| :--- | :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, ES6 JavaScript | Semantic HTML5, CSS Custom Properties | Responsive client dashboard, task submission forms, KPI metric cards, and modals. |
| **Backend** | Cloudflare Workers | JavaScript ES Modules (`export default { fetch }`) | Serverless edge execution; serves embedded web assets and routes REST API requests. |
| **Database** | Cloudflare Workers KV | Distributed Global Key-Value Store | Low-latency key-value store for JSON task documents under `task:<id>` keys. |
| **IaC Engine** | HashiCorp Terraform | CLI v1.16+ (tested on v1.16.5) | Declarative cloud management; provisions KV namespaces, Worker scripts, and bindings. |
| **IaC Provider** | Cloudflare Terraform Provider | `cloudflare/cloudflare ~> 4.45.0` | Translates Terraform HCL resource declarations into Cloudflare REST API v4 calls. |
| **Version Control** | Git & GitHub | Git v2.40+ | Tracks application source code and infrastructure HCL definitions with commit history. |
| **CI/CD Automation** | GitHub Actions | `ubuntu-latest`, `hashicorp/setup-terraform@v3` | Automated deployment pipeline triggering on git pushes to the `main` branch. |
| **Local Runtime** | Node.js | v18+ / v22+ | Zero-dependency local mock server (`test-server.js`) with file persistence in `local-kv-store.json`. |

---

## 4. System Architecture and Request Flow

### Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  Web Browser (Desktop / Tablet / Mobile)                                          |
|  - Renders Obsidian Glassmorphism UI                                             |
|  - Dispatches Asynchronous fetch() REST requests to /api/tasks                    |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          | HTTPS (TLS 1.3)
                                          v
+-----------------------------------------------------------------------------------+
|                        CLOUDFLARE EDGE NETWORK (SERVERLESS)                       |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Cloudflare Worker Script: student-task-manager-dev                          |  |
|  | - Serves Embedded Web Assets (GET /, /style.css, /script.js)                 |  |
|  | - Directs API requests based on HTTP Method and URL Path Regex              |  |
|  | - Handles CORS pre-flight OPTIONS headers and payload validation            |  |
|  +--------------------------------------+--------------------------------------+  |
|                                         |                                         |
|                                         | Worker-to-KV Binding (env.TASKS_KV)     |
|                                         v                                         |
|  +-----------------------------------------------------------------------------+  |
|  | Cloudflare Workers KV Namespace: dev-student-tasks-kv                       |  |
|  | - Global Distributed Key-Value Storage                                      |  |
|  | - Schema: Key="task:<task_id>" -> Value=JSON.stringify(TaskObject)          |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------+-----------------------------------------+
                                          ^
                                          |
              Provisioned, Configured, Updated, and Destroyed Declaratively
                                          |
+-----------------------------------------+-----------------------------------------+
|                               MANAGEMENT TIER                                     |
|                                                                                   |
|  +--------------------------------------+   +----------------------------------+  |
|  | Local Workstation (Terraform CLI)    |   | GitHub Actions CI/CD Pipeline    |  |
|  | - terraform init / validate / plan   |   | - Triggered on git push to main |  |
|  | - terraform apply / destroy         |   | - Automated test & deploy job    |  |
|  +--------------------------------------+   +----------------------------------+  |
+-----------------------------------------------------------------------------------+
```

### Request Flow
1. **Asset Retrieval**: User visits `https://student-task-manager-dev.<subdomain>.workers.dev/`. The Worker intercepts the request and serves the inlined `index.html`, `/style.css`, and `/script.js`.
2. **Client Startup**: `script.js` initializes, checks its hostname (using relative `/api/tasks` when deployed to Cloudflare), and sends a `GET /api/tasks` request.
3. **CRUD Processing**: When a user creates, updates, or deletes a task, `script.js` issues a `POST`, `PUT`, or `DELETE` request to `/api/tasks`.
4. **KV Persistence**: The Worker validates the input and uses the `env.TASKS_KV` binding to perform atomic `.put()`, `.get()`, or `.delete()` operations.
5. **UI Updates**: The client receives the JSON response, dynamically refreshes the task grid, and recalculates KPI metrics.

---

## 5. Application Functionality

The application is designed specifically for student workload tracking:
- **Task Creation**: Add tasks with Title and Priority (`Low`, `Medium`, `High`). Form validates input and trims extra whitespace.
- **KPI Metrics Dashboard**: Instant summary cards showing:
  - *Total Tasks*
  - *Pending Tasks*
  - *In Progress Tasks*
  - *Completed Tasks*
  - *High Priority Count*
- **Inline Status Updates**: Change task status directly via card dropdown (`Pending`, `In Progress`, `Completed`) without page reloads.
- **Task Inspection Modal**: Click **Details** to view the task ID, creation timestamp, status, priority, and raw JSON payload from KV storage.
- **Task Deletion**: Safely delete tasks with a confirmation dialog.
- **Search & Filter**: Search tasks by title or ID and filter by status tabs.
- **Status Indicator**: Header pill displays live backend connectivity with a pulsing green indicator.

---

## 6. REST API Endpoint Table

All endpoints return valid JSON and include CORS headers (`Access-Control-Allow-Origin: *`).

| Method | Endpoint | Description | Request Body | Success Code | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/tasks` | Retrieves all tasks sorted chronologically (newest first). | *None* | `200 OK` | `500 Internal Error` |
| **POST** | `/api/tasks` | Creates a new task with unique ID and `Pending` status. | `{"title": "string", "priority": "Low"\|"Medium"\|"High"}` | `201 Created` | `400 Bad Request` (missing title or invalid priority) |
| **GET** | `/api/tasks/{id}` | Retrieves a single task record by ID. | *None* | `200 OK` | `404 Not Found` |
| **PUT** | `/api/tasks/{id}` | Updates task status, priority, or title. | `{"status": "Pending"\|"In Progress"\|"Completed", ...}` | `200 OK` | `400 Bad Request`, `404 Not Found` |
| **DELETE** | `/api/tasks/{id}` | Permanently removes a task from KV storage. | *None* | `200 OK` | `404 Not Found` |

---

## 7. Cloudflare Workers and Workers KV Explanation

### Cloudflare Workers
A serverless execution environment that runs JavaScript code across Cloudflare's edge locations worldwide. Workers execute within lightweight Google V8 isolates, eliminating container spin-up time and avoiding cold starts (< 5ms response latency).

### Cloudflare Workers KV
A globally distributed key-value storage system optimized for high-volume read operations. In this application, tasks are serialized as JSON and stored under unique keys using the prefix pattern `task:<task_id>`.

### The Necessity of KV Bindings
Workers operate in a secure sandbox and cannot access storage accounts via hardcoded credentials or database connection strings. A **KV binding** declares a named reference (`TASKS_KV`) in the Worker's environment (`env.TASKS_KV`). This provides authenticated runtime methods (`.get()`, `.put()`, `.delete()`, `.list()`) without exposing account secrets.

---

## 8. Terraform Files and Their Responsibilities

All infrastructure configuration is located in the `terraform/` directory:

| File | Primary Responsibility |
| :--- | :--- |
| `providers.tf` | Declares required Terraform version (`>= 1.5.0`) and configures the `cloudflare/cloudflare` provider (`~> 4.45.0`). |
| `variables.tf` | Defines configurable input variables (`cloudflare_account_id`, `cloudflare_api_token`, `environment`, `tags`, etc.). Credentials are marked `sensitive = true`. |
| `main.tf` | Core infrastructure: provisions `cloudflare_workers_kv_namespace.tasks_kv`, bundles frontend assets into the Worker script, creates `cloudflare_workers_script.task_manager`, and configures `kv_namespace_binding`. |
| `outputs.tf` | Exports resource identifiers and endpoints (`kv_namespace_id`, `worker_script_name`, `application_url_format`). |
| `backend.tf` | Documents remote state configuration options for CI/CD runners (Cloudflare R2 S3-compatible backend and HCP Terraform). |
| `terraform.tfvars.example` | Safe template containing placeholder variables for local deployment. |

---

## 9. Infrastructure Initialization, Validation, Planning, and Deployment

### Step 9.1: Configure Local Variables
Navigate to the `terraform/` directory and copy the template:
```powershell
cd "d:\cc project2\student-task-manager-iac\terraform"
copy terraform.tfvars.example terraform.tfvars
```
Insert your actual Cloudflare credentials into `terraform.tfvars`:
```hcl
cloudflare_account_id = "your_actual_32_character_account_id"
cloudflare_api_token  = "your_actual_40_character_api_token"
environment           = "dev"
worker_name           = "student-task-manager"
```

### Step 9.2: Step 1 - Initialize (`terraform init`)
Downloads the Cloudflare provider plugin and initializes local state tracking:
```powershell
terraform init
```

### Step 9.3: Step 2 - Check Formatting (`terraform fmt -check`)
Verifies that all `.tf` files adhere to canonical HCL style:
```powershell
terraform fmt -check
```

### Step 9.4: Step 3 - Validate Syntax (`terraform validate`)
Verifies internal configuration consistency and syntax:
```powershell
terraform validate
```
*Expected Output*: `Success! The configuration is valid.`

### Step 9.5: Step 4 - Generate Plan (`terraform plan`)
Previews all actions against the Cloudflare API before applying:
```powershell
terraform plan
```
*Expected Output*: `Plan: 2 to add, 0 to change, 0 to destroy.`

### Step 9.6: Step 5 - Apply Deployment (`terraform apply`)
Provisions the KV namespace, bundles frontend assets, and deploys the Worker script:
```powershell
terraform apply -auto-approve
```
*Expected Output*: `Apply complete! Resources: 2 added, 0 changed, 0 destroyed.` along with exported outputs.

---

## 10. Demonstration of an Infrastructure Modification and Subsequent Update

To demonstrate how Terraform manages infrastructure changes declaratively without recreation:

1. Open `terraform/terraform.tfvars` and add a new tag and update the compatibility date:
   ```hcl
   compatibility_date = "2024-10-01"
   tags               = ["student-tasks", "iac-managed", "v2-modified"]
   ```
2. Run speculative plan:
   ```powershell
   terraform plan
   ```
   *Expected Output*: Terraform identifies an in-place update:
   `~ update in-place` on `cloudflare_workers_script.task_manager` (`0 to add, 1 to change, 0 to destroy`).
3. Apply the modification:
   ```powershell
   terraform apply -auto-approve
   ```
   *Expected Output*: `Apply complete! Resources: 0 added, 1 changed, 0 destroyed.` (Zero downtime, data preserved).

---

## 11. GitHub Repository and GitHub Actions CI/CD

### 11.1 Push to GitHub
```powershell
cd "d:\cc project2\student-task-manager-iac"
git remote add origin https://github.com/<YOUR_USERNAME>/student-task-manager-iac.git
git branch -M main
git push -u origin main
```

### 11.2 Configure GitHub Secrets
In your GitHub repository, navigate to **Settings** &rarr; **Secrets and variables** &rarr; **Actions** and add:
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token.
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID.

### 11.3 CI/CD Workflow (`.github/workflows/deploy.yml`)
The workflow automatically executes on pushes to `main`:
1. Checks out repository code.
2. Installs HashiCorp Terraform CLI `v1.16.5`.
3. Checks canonical formatting (`terraform fmt -check`).
4. Initializes provider plugins (`terraform init`).
5. Validates syntax (`terraform validate`).
6. Generates speculative execution plan (`terraform plan -out=tfplan`).
7. Applies plan to Cloudflare (`terraform apply tfplan`).

---

## 12. Terraform Destroy and Verification of Resource Removal

To demonstrate complete, clean teardown of provisioned infrastructure:

1. **Review Destroy Plan**:
   ```powershell
   terraform plan -destroy
   ```
   *Output indicates*: `Plan: 0 to add, 0 to change, 2 to destroy.`
2. **Execute Teardown**:
   ```powershell
   terraform destroy -auto-approve
   ```
   *Output indicates*: `Destroy complete! Resources: 2 destroyed.`
3. **Verify Resource Removal**:
   - Run `terraform show`: Returns blank (state is empty).
   - Attempt to access the deployed Worker URL in a browser: Returns HTTP 404 or Cloudflare Error 10042 (Worker is no longer present on Cloudflare's network).
   - In Cloudflare Dashboard under **Workers & Pages**, confirm that both the Worker and KV namespace are removed.

---

## 13. Recreation of the Infrastructure

To demonstrate idempotency and repeatability:

1. **Re-run Plan and Apply**:
   ```powershell
   terraform plan
   terraform apply -auto-approve
   ```
   *Output indicates*: `Apply complete! Resources: 2 added, 0 changed, 0 destroyed.`
2. **Verify Restored Application**:
   - Navigate to the newly output Worker URL.
   - Confirm the Student Task Manager loads in an empty state.
   - Create a new task and confirm that storage and retrieval function correctly.

---

## 14. Results, Limitations, and Conclusion

### Results
- Successfully automated the full lifecycle of a serverless application using Terraform.
- Zero manual resource creation required in the Cloudflare dashboard.
- Verified 5-point REST API suite with JSON validation and CORS support.
- Fully documented local testing, remote deployment, teardown, and recreation.

### Limitations
- **KV Eventual Consistency**: High-concurrency write updates can take up to 60 seconds to propagate globally.
- **Free Plan Limits**: Cloudflare Free tier limits Worker invocations to 100,000/day and KV writes to 1,000/day.
- **CI/CD Runner State**: Ephemeral GitHub Actions runners require an external remote backend (such as Cloudflare R2 or HCP Terraform) to preserve state across multiple workflow runs.

### Conclusion
This project successfully proves that serverless applications can be deployed, updated, destroyed, and recreated predictably using declarative Infrastructure as Code. By codifying architecture into Terraform, human error is eliminated and deployments become completely reproducible.

---

## 15. Screenshot Checklist for Project Report and Viva

Capture each screenshot in this exact sequence for your report and viva defense. Save all images in the `screenshots/` directory.

| # | Exact Screenshot Item | Recommended Filename | Clear Capture Instructions (What to Capture Yourself) |
| :-: | :--- | :--- | :--- |
| **1** | **Project folder structure** | `01_project_folder_structure.png` | Open VS Code / IDE showing the file tree expanded: `application/`, `terraform/`, `.github/workflows/`, `screenshots/`, and root files. |
| **2** | **Working application with tasks displayed** | `02_working_application_dashboard.png` | Open web browser at `http://localhost:3000` or live Worker URL with tasks displayed and KPI metric cards populated. |
| **3** | **Successful task creation, status update, and deletion** | `03_task_crud_operations.png` | Capture application UI showing task added (green success toast), status updated via dropdown, and a task deleted. |
| **4** | **`terraform init` and `terraform validate`** | `04_terraform_init_validate.png` | Open terminal in `terraform/`. Run `terraform init` and `terraform validate`, capturing `Success! The configuration is valid.` |
| **5** | **Initial `terraform plan`** | `05_terraform_plan_initial.png` | Terminal showing `terraform plan` output showing `Plan: 2 to add, 0 to change, 0 to destroy`. |
| **6** | **Successful `terraform apply`** | `06_terraform_apply_success.png` | Terminal showing `terraform apply` completed with `Apply complete! Resources: 2 added, 0 changed, 0 destroyed.` |
| **7** | **Terraform outputs showing deployed Worker URL** | `07_terraform_outputs_worker_url.png` | Terminal showing `terraform output` displaying `application_url_format`, `kv_namespace_id`, and `worker_script_name`. |
| **8** | **Cloudflare dashboard showing Worker and KV** | `08_cloudflare_dashboard_worker_kv.png` | Cloudflare Dashboard &rarr; **Workers & Pages** showing `student-task-manager-dev` and under **KV** showing `dev-student-tasks-kv`. |
| **9** | **Evidence of tasks stored in KV via deployed app** | `09_tasks_stored_in_kv_evidence.png` | Cloudflare Dashboard &rarr; **KV** &rarr; `dev-student-tasks-kv` &rarr; View Keys showing `task:task_...` keys and raw JSON values. |
| **10** | **Terraform plan showing an infrastructure modification** | `10_terraform_plan_modification.png` | Terminal showing `terraform plan` after modifying `tags` or `compatibility_date`, highlighting `~ update in-place` (`1 to change`). |
| **11** | **Successful application of the modification** | `11_terraform_apply_modification.png` | Terminal showing `terraform apply` completed with `Resources: 0 added, 1 changed, 0 destroyed.` |
| **12** | **GitHub repository containing source code** | `12_github_repository_code.png` | Browser showing your GitHub repository page with commit history, folder layout, and `README.md`. |
| **13** | **GitHub Actions workflow run** | `13_github_actions_workflow_run.png` | GitHub repository &rarr; **Actions** tab showing successful workflow execution with green checkmarks on each step. |
| **14** | **`terraform plan -destroy`** | `14_terraform_plan_destroy.png` | Terminal showing `terraform plan -destroy` output indicating `Plan: 0 to add, 0 to change, 2 to destroy.` |
| **15** | **Successful `terraform destroy` and resource removal** | `15_terraform_destroy_verified.png` | Terminal showing `Destroy complete! Resources: 2 destroyed.` followed by empty `terraform show`. |
| **16** | **Successful recreation using plan and apply** | `16_terraform_recreate_apply.png` | Terminal showing subsequent `terraform apply` recreating both resources (`2 added, 0 changed, 0 destroyed`). |
| **17** | **Working application after recreation** | `17_working_app_after_recreation.png` | Browser showing the freshly recreated Worker URL loading the functional application with newly added task. |

---

## 16. Viva Preparation & Examiner Q&A

### Q1: What is Infrastructure as Code (IaC)?
**Answer**: Infrastructure as Code is the practice of managing and provisioning computing infrastructure using machine-readable configuration files rather than physical hardware configuration or interactive web consoles. It allows infrastructure to be version-controlled, tested, and reproduced reliably.

### Q2: Why is Terraform used in this project?
**Answer**: Terraform is an open-source, declarative Infrastructure as Code tool. It provides:
1. **State Management**: Tracks deployed cloud resources in `terraform.tfstate`.
2. **Predictable Planning**: `terraform plan` lets us preview changes before modifying cloud resources.
3. **Provider Ecosystem**: Connects to the Cloudflare API to manage Workers, KV namespaces, and bindings through a unified syntax.

### Q3: What is a Cloudflare Worker?
**Answer**: A Cloudflare Worker is a serverless execution environment that runs JavaScript code at edge data centers across the globe. Rather than using virtual machines or containers, Workers execute inside Google V8 isolates, providing near-instant startup (< 5ms) and automatic global scaling.

### Q4: What is Workers KV?
**Answer**: Workers KV is a globally distributed, low-latency key-value data store. It is designed for high read volumes and stores data as key-value pairs. In our project, it stores JSON-serialized student tasks under keys formatted as `task:<task_id>`.

### Q5: Why is a KV binding required?
**Answer**: Cloudflare Workers run in an isolated sandbox and cannot connect to arbitrary storage by default. A **KV binding** declares a named reference (`TASKS_KV`) in the Worker's environment (`env.TASKS_KV`). This provides authenticated runtime methods (`.get()`, `.put()`, `.delete()`, `.list()`) without hardcoding credentials in application code.

### Q6: What is the purpose of `terraform init`, `validate`, `plan`, `apply`, and `destroy`?
**Answer**:
- `terraform init`: Initializes the workspace and downloads necessary provider plugins.
- `terraform validate`: Checks configuration syntax and resource arguments for errors.
- `terraform plan`: Previews changes by comparing local code with active cloud state.
- `terraform apply`: Provisions or updates infrastructure on the cloud provider according to the plan.
- `terraform destroy`: Safely removes all resources tracked in the state file.

### Q7: What is the difference between application code and infrastructure code?
**Answer**:
- **Application Code** (`application/`): The software logic, user interface, and API request handling (HTML, CSS, JavaScript).
- **Infrastructure Code** (`terraform/`): The declarative definitions that provision the runtime environment (Cloudflare Worker, Workers KV namespace, and bindings) necessary to host and execute that software.

### Q8: How does GitHub Actions automate deployment?
**Answer**: When code is pushed to the `main` branch, GitHub Actions launches an ephemeral virtual machine, securely injects credentials from repository secrets, runs formatting and validation checks, executes `terraform plan`, and automatically applies the deployment to Cloudflare.

### Q9: How are API credentials protected?
**Answer**:
1. Credentials are never written in `.tf` files or committed to Git.
2. The `cloudflare_api_token` variable is marked `sensitive = true`, preventing it from printing in terminal logs.
3. `.gitignore` excludes `terraform.tfvars`, `*.tfstate`, and `.env`.
4. In CI/CD, credentials are stored in encrypted **GitHub Secrets** and masked in runner logs.

### Q10: How do we prove that infrastructure was recreated rather than manually created?
**Answer**:
1. Running `terraform destroy` completely removes the resources and clears the state file (`terraform show` returns empty).
2. Visiting the Worker URL confirms the service is gone (404 / 10042 error).
3. Running `terraform apply` provisions brand-new resources with new Cloudflare resource IDs generated by the API.
4. Git commit history and `main.tf` provide verifiable proof that all configuration originates from code.

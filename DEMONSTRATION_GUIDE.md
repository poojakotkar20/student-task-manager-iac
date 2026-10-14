# Project Demonstration & Evaluation Guide
## Automated Deployment of a Serverless Student Task Management Application Using Terraform-Based Infrastructure as Code

This document provides a comprehensive, step-by-step walkthrough for presenting, evaluating, and defending this mini-project. It is structured to prove that the infrastructure is fully managed through declarative Infrastructure as Code (IaC) rather than ad-hoc dashboard clicks.

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
15. [Required Screenshots Checklist (In Exact Evaluation Order)](#15-required-screenshots-checklist)
16. [Viva Preparation & Examiner Q&A](#16-viva-preparation--examiner-qa)

---

## 1. Introduction and Problem Statement

### 1.1 Context
In traditional web application development, cloud infrastructure (compute instances, database storage, routing rules, network gateways) is often configured manually through web consoles (e.g., AWS Management Console, Cloudflare Dashboard, or Azure Portal). 

### 1.2 The Problem
Manual provisioning introduces severe operational flaws:
- **Configuration Drift**: Over time, manual tweaks cause discrepancies between environments (development, staging, production).
- **Human Error & Inconsistency**: Forgetting to configure an environment variable, an IAM role, or a database binding breaks deployments.
- **Lack of Auditability**: Cloud console clicks leave no version-controlled git history of who changed what, when, or why.
- **Slow Teardown and Costly Rebuilding**: Recreating or tearing down multi-resource architectures takes hours or days and is prone to omission.

### 1.3 The Solution
This project solves these challenges by implementing **Infrastructure as Code (IaC)** using **HashiCorp Terraform** targeting the **Cloudflare Serverless ecosystem**. 
- The entire cloud topology—including the serverless compute engine (**Cloudflare Worker**), persistent distributed database (**Workers KV**), and the inter-service security context (**KV Binding**)—is declared as code in HashiCorp Configuration Language (HCL).
- With a single command, the entire stack can be provisioned, updated without downtime, completely destroyed, and rebuilt identically from scratch in seconds.

---

## 2. Project Objectives

1. **Declarative Cloud Provisioning (IaC Focus)**: Manage 100% of the Cloudflare serverless footprint via Terraform without touching the Cloudflare dashboard for resource creation.
2. **Serverless Edge Execution**: Build a RESTful backend using modern JavaScript running on Cloudflare's V8 edge isolates, avoiding virtual machine or container overhead.
3. **Distributed Key-Value Persistence**: Store, retrieve, update, and delete student task records with atomic keys in Cloudflare Workers KV.
4. **Interactive Single-Page Dashboard**: Implement a responsive student task interface in Vanilla HTML, CSS, and JavaScript featuring KPI metrics, status updates, priority badges, and JSON state inspection.
5. **Continuous Integration & Continuous Deployment (CI/CD)**: Automate syntax formatting (`terraform fmt`), provider verification (`terraform init`), configuration validation (`terraform validate`), planning (`terraform plan`), and automated deployment (`terraform apply`) via GitHub Actions.
6. **Zero-Trust Secret Hygiene**: Strictly separate sensitive API credentials from version control using `.gitignore`, Terraform input variables with `sensitive = true`, and GitHub Repository Secrets.

---

## 3. Tools and Technologies Used

| Layer | Technology | Version / Specification | Role in Project |
| :--- | :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, ES6 JavaScript | Semantic HTML5, CSS Custom Properties | Single-page responsive user dashboard, task forms, KPI counters, and inspector modal. |
| **Backend Compute** | Cloudflare Workers | V8 Engine / ES Modules format | Serverless edge compute; serves static assets and executes REST API business logic. |
| **Database Storage** | Cloudflare Workers KV | Distributed Global Key-Value Store | Low-latency persistent storage for JSON task documents with `task:<id>` key schema. |
| **Infrastructure as Code** | HashiCorp Terraform | CLI v1.16+ (tested on v1.16.5) | Declarative cloud management; provisions KV namespaces, Worker scripts, and bindings. |
| **Cloud Provider** | Cloudflare Provider for Terraform | `cloudflare/cloudflare ~> 4.45.0` | Terraform plugin that translates HCL resource blocks into Cloudflare REST API v4 calls. |
| **Version Control** | Git & GitHub | Git v2.40+ | Distributed version control tracking application source code and infrastructure HCL files. |
| **CI/CD Pipeline** | GitHub Actions | `ubuntu-latest`, `hashicorp/setup-terraform@v3` | Automated pipeline validating syntax, planning changes, and applying updates on pushes to `main`. |
| **Local Runtime** | Node.js | v18+ / v22+ | Local zero-dependency test harness (`test-server.js`) with file persistence in `local-kv-store.json`. |

---

## 4. System Architecture and Request Flow

### 4.1 High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  Web Browser (Desktop / Mobile)                                                   |
|  - Renders Glassmorphism Dark UI                                                  |
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

### 4.2 End-to-End Request Flow
1. **Asset Request**: When a browser navigates to `https://student-task-manager-dev.<subdomain>.workers.dev/`, Cloudflare Anycast routes the request to the nearest edge PoP (Point of Presence).
2. **Edge Execution**: The Worker script intercepts the request:
   - Path `/` &rarr; Returns inlined `index.html` (`Content-Type: text/html`).
   - Path `/style.css` &rarr; Returns inlined stylesheet (`Content-Type: text/css`).
   - Path `/script.js` &rarr; Returns inlined JavaScript client (`Content-Type: application/javascript`).
3. **Client-Side Initialization**: `script.js` loads, detects its runtime environment (determines whether it is hosted on `*.workers.dev` or `localhost`), and issues an initial `GET /api/tasks` request.
4. **Data Interaction**:
   - When creating a task, `POST /api/tasks` sends `{ "title": "Complete IaC Lab", "priority": "High" }`.
   - The Worker validates the payload, generates a unique ID (`task_<timestamp>_<random>`), captures the ISO 8601 creation timestamp, and calls `env.TASKS_KV.put(key, JSON.stringify(task))`.
   - The Worker responds with HTTP `201 Created` and the serialized task object.
5. **Real-time UI Refresh**: The client updates the task grid and recalculates KPI metrics (Total Tasks, Pending, In Progress, Completed, High Priority).

---

## 5. Application Functionality

The application is tailored for student workload management with an intuitive dark-themed user interface:

### 5.1 Key Capabilities:
- **Task Creation**: Add tasks with a mandatory title and a selectable priority (`Low`, `Medium`, or `High`). Form automatically validates input and trims whitespace.
- **Real-Time KPI Cards**: Metrics automatically update on every create, edit, or delete action:
  - *Total Tasks*
  - *Pending Tasks*
  - *In Progress Tasks*
  - *Completed Tasks*
  - *High Priority Count*
- **Inline Status Modification**: Each task card features a quick status selector (`Pending`, `In Progress`, `Completed`) that triggers an immediate asynchronous `PUT /api/tasks/{id}` request without a full page reload.
- **Deep Task Inspection (Details Modal)**: Clicking **Details** opens a dialog displaying full metadata:
  - Unique Task ID
  - Created Date & Time
  - Priority Badge
  - Current Status
  - Raw JSON payload directly from the database
- **Safe Task Deletion**: Includes an interactive confirmation modal to prevent accidental task deletion.
- **Filtering & Search**: Real-time filtering by status tab (`All`, `Pending`, `In Progress`, `Completed`) and search text filter across task titles and IDs.
- **Resilient Connectivity Indicator**: Header status pill dynamically detects backend health and displays "Live Serverless API" with a green pulse dot.

---

## 6. REST API Endpoint Table

All endpoints return standard HTTP status codes and valid `application/json` response bodies with appropriate CORS headers (`Access-Control-Allow-Origin: *`).

| Method | Endpoint | Description | Request Body | Success Code | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/tasks` | Retrieves all student tasks sorted chronologically (newest first). | *None* | `200 OK` | `500 Internal Error` |
| **POST** | `/api/tasks` | Creates a new task. Generates unique ID, sets status to `Pending`. | `{"title": "string", "priority": "Low"\|"Medium"\|"High"}` | `201 Created` | `400 Bad Request` (empty title or invalid priority) |
| **GET** | `/api/tasks/{id}` | Retrieves a single task record by its unique ID. | *None* | `200 OK` | `404 Not Found` (invalid or non-existent ID) |
| **PUT** | `/api/tasks/{id}` | Updates task title, priority, or status. | `{"status": "Pending"\|"In Progress"\|"Completed", ...}` | `200 OK` | `400 Bad Request`, `404 Not Found` |
| **DELETE** | `/api/tasks/{id}` | Permanently deletes a task from KV storage. | *None* | `200 OK` | `404 Not Found` |

---

## 7. Cloudflare Workers and Workers KV Explanation

### 7.1 What is a Cloudflare Worker?
A **Cloudflare Worker** is a serverless execution environment that runs JavaScript (or WebAssembly) directly on Cloudflare's global edge network across 300+ cities worldwide.
- **No Cold Starts**: Unlike AWS Lambda or traditional containers that spin up Linux micro-VMs, Cloudflare Workers run inside lightweight Google V8 isolates. Worker startup latency is practically zero (< 5 milliseconds).
- **Edge Routing**: The Worker intercepts HTTP traffic before it ever touches an origin server, allowing compute to run directly adjacent to the user.

### 7.2 What is Cloudflare Workers KV?
**Cloudflare Workers KV** is a highly distributed, globally replicated key-value data store.
- **Low-Latency Reads**: Data stored in KV is cached and replicated to edge nodes globally, ensuring ultra-fast read performance for distributed applications.
- **Key-Value Data Model**: Data is accessed using simple keys (e.g., `task:task_1728901234_abc`). Values are strings, which our application utilizes to store stringified JSON documents.

### 7.3 Why is a KV Binding Required?
In Cloudflare Workers, a Worker script cannot access arbitrary KV stores by hardcoded URL or database password. Instead, Cloudflare enforces secure isolation using **Bindings**:
- A **Binding** is an environment variable bridge declared in infrastructure configuration.
- In our Terraform configuration:
  ```hcl
  kv_namespace_binding {
    name         = "TASKS_KV"
    namespace_id = cloudflare_workers_kv_namespace.tasks_kv.id
  }
  ```
- This securely injects the KV client instance directly into the Worker's `env` parameter (`env.TASKS_KV`).
- Without this Terraform binding, the Worker cannot invoke `.get()`, `.put()`, or `.delete()`.

---

## 8. Terraform Files and Their Responsibilities

All infrastructure code resides cleanly inside the `terraform/` directory:

```
terraform/
├── providers.tf             # Declares required Terraform version & Cloudflare provider plugin
├── variables.tf             # Defines parameterized inputs (Account ID, token, environment, tags)
├── main.tf                  # Provisions KV namespace, bundles assets, and deploys Worker script
├── outputs.tf               # Exports non-sensitive identifiers and deployed Worker URL formats
├── backend.tf               # Documents free remote state options (Cloudflare R2 / HCP Terraform)
└── terraform.tfvars.example # Safe credential template with placeholders
```

### Detailed File Responsibilities:
1. **`providers.tf`**:
   - Pins Terraform version to `>= 1.5.0` (validated with v1.16.5).
   - Declares the official provider `cloudflare/cloudflare` pinned to `~> 4.45.0`.
   - Passes the `api_token` to the provider block.
2. **`variables.tf`**:
   - `cloudflare_api_token`: Marked with `sensitive = true` so credentials are never leaked in terminal logs or console outputs.
   - `cloudflare_account_id`: Mandatory 32-character hexadecimal account identifier.
   - `environment`: Configurable stage (`dev`, `staging`, `prod`) with strict validation rules.
   - `worker_name`, `compatibility_date`, and `tags`: Fully parameterized to avoid hardcoding.
3. **`main.tf`**:
   - `cloudflare_workers_kv_namespace.tasks_kv`: Declares and creates the storage bucket (`dev-student-tasks-kv`).
   - `locals`: Reads `index.html`, `style.css`, and `script.js` directly from the `application/` directory and inlines them into `worker.js` using `jsonencode()` and `replace()`. This packages the entire application into a self-contained ~76 KB serverless bundle without requiring third-party build tools.
   - `cloudflare_workers_script.task_manager`: Provisions the Worker with `module = true` (ES Modules standard) and links the `kv_namespace_binding`.
4. **`outputs.tf`**:
   - Exposes `kv_namespace_id`, `kv_namespace_title`, `worker_script_name`, `worker_compatibility_date`, `worker_tags`, and the target `application_url_format`.
5. **`backend.tf`**:
   - Documents the remote state strategy for CI/CD runners using free Cloudflare R2 (S3-compatible) or Terraform Cloud.

---

## 9. Infrastructure Initialization, Validation, Planning, and Deployment

### Step 9.1: Configure Authentication Credentials
1. Navigate to the `terraform/` directory:
   ```powershell
   cd "d:\cc project2\student-task-manager-iac\terraform"
   ```
2. Create your private `terraform.tfvars` from the example template:
   ```powershell
   copy terraform.tfvars.example terraform.tfvars
   ```
3. Edit `terraform.tfvars` with your actual Cloudflare credentials:
   ```hcl
   cloudflare_account_id = "your_actual_32_char_account_id"
   cloudflare_api_token  = "your_actual_40_char_api_token"
   environment           = "dev"
   worker_name           = "student-task-manager"
   ```

### Step 9.2: Step 1 - Initialize Terraform (`terraform init`)
Initializes the working directory, downloads the `cloudflare/cloudflare` provider plugin, and sets up state tracking:
```powershell
terraform init
```
*Expected Result*: Output ends with `Terraform has been successfully initialized!`

### Step 9.3: Step 2 - Check Canonical Formatting (`terraform fmt -check`)
Ensures all HCL files follow standard indentation and style:
```powershell
terraform fmt -check
```
*Expected Result*: Returns exit code 0 silently when formatting is canonical.

### Step 9.4: Step 3 - Validate Configuration Syntax (`terraform validate`)
Verifies that all resource declarations, argument types, and bindings are syntactically sound:
```powershell
terraform validate
```
*Expected Result*: Output displays `Success! The configuration is valid.`

### Step 9.5: Step 4 - Generate Speculative Execution Plan (`terraform plan`)
Queries the Cloudflare API to compare current state with declared HCL:
```powershell
terraform plan
```
*Expected Output Summary*:
```
Plan: 2 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + api_tasks_endpoint_format = (known after apply)
  + application_url_format    = (known after apply)
  + kv_namespace_id           = (known after apply)
  + kv_namespace_title        = "dev-student-tasks-kv"
  + worker_script_name        = "student-task-manager-dev"
```

### Step 9.6: Step 5 - Apply and Deploy (`terraform apply`)
Applies the planned changes against Cloudflare:
```powershell
terraform apply -auto-approve
```
*Expected Output Summary*:
```
cloudflare_workers_kv_namespace.tasks_kv: Creating...
cloudflare_workers_kv_namespace.tasks_kv: Creation complete
cloudflare_workers_script.task_manager: Creating...
cloudflare_workers_script.task_manager: Creation complete

Apply complete! Resources: 2 added, 0 changed, 0 destroyed.

Outputs:
kv_namespace_id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
kv_namespace_title = "dev-student-tasks-kv"
worker_script_name = "student-task-manager-dev"
application_url_format = "https://student-task-manager-dev.<subdomain>.workers.dev"
```

---

## 10. Demonstration of an Infrastructure Modification and Subsequent Update

To demonstrate that Terraform is not just a one-time installer, but manages the entire lifecycle of infrastructure:

### Step 10.1: Declare the Desired Change
Open `terraform/terraform.tfvars` and modify the metadata tags and compatibility date:
```hcl
compatibility_date = "2024-10-01"
tags               = ["student-tasks", "iac-managed", "v2-modified"]
```

### Step 10.2: Review the Speculative Plan
```powershell
terraform plan
```
*Observed Behavior*: Terraform detects that the KV namespace does not need touching, but the Worker script requires an in-place update:
```
  ~ resource "cloudflare_workers_script" "task_manager" {
        id                 = "student-task-manager-dev"
        name               = "student-task-manager-dev"
      ~ compatibility_date = "2024-09-23" -> "2024-10-01"
      ~ tags               = [
            "student-tasks",
            "iac-managed",
          + "v2-modified",
        ]
        # (all other arguments remain unchanged)
    }

Plan: 0 to add, 1 to change, 0 to destroy.
```

### Step 10.3: Apply the Modification
```powershell
terraform apply -auto-approve
```
*Observed Behavior*:
`Apply complete! Resources: 0 added, 1 changed, 0 destroyed.`
The modification is deployed instantly with **zero downtime** and **zero data loss** in the KV store.

---

## 11. GitHub Repository and GitHub Actions CI/CD

### 11.1 Push Code to GitHub
```powershell
cd "d:\cc project2\student-task-manager-iac"
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/student-task-manager-iac.git
git branch -M main
git push -u origin main
```

### 11.2 Configure GitHub Secrets
In your GitHub repository:
1. Navigate to **Settings** &rarr; **Secrets and variables** &rarr; **Actions**.
2. Click **New repository secret** and add:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token.
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID.

### 11.3 Automated CI/CD Workflow (`.github/workflows/deploy.yml`)
Whenever code is pushed to `main`, GitHub Actions automatically:
1. Checks out the repository code.
2. Installs Terraform CLI `v1.16.5`.
3. Runs `terraform fmt -check` to enforce style.
4. Runs `terraform init` with secure credentials injected from GitHub Secrets.
5. Runs `terraform validate` to verify syntax.
6. Executes `terraform plan` to generate a binary execution plan (`tfplan`).
7. Executes `terraform apply tfplan` automatically on `main`.

---

## 12. Terraform Destroy and Verification of Resource Removal

To demonstrate complete infrastructure teardown:

### Step 12.1: Teardown Plan
```powershell
terraform plan -destroy
```
*Observed Output*: Shows that both the Worker script and the KV namespace will be destroyed:
`Plan: 0 to add, 0 to change, 2 to destroy.`

### Step 12.2: Execute Teardown
```powershell
terraform destroy -auto-approve
```
*Observed Output*:
```
cloudflare_workers_script.task_manager: Destroying...
cloudflare_workers_script.task_manager: Destruction complete
cloudflare_workers_kv_namespace.tasks_kv: Destroying...
cloudflare_workers_kv_namespace.tasks_kv: Destruction complete

Destroy complete! Resources: 2 destroyed.
```

### Step 12.3: Verification of Resource Removal
1. Run `terraform show`:
   *Output*: Returns completely blank (no managed resources in state).
2. Visit `https://student-task-manager-dev.<subdomain>.workers.dev/`:
   *Output*: Browser returns HTTP `10042` or `404 Not Found` (Worker no longer exists on Cloudflare's network).
3. Check Cloudflare Dashboard under **Workers & Pages**: Both the Worker and KV namespace have been permanently removed.

---

## 13. Recreation of the Infrastructure

To demonstrate idempotency and repeatability:

### Step 13.1: Re-provision Clean Infrastructure
```powershell
terraform plan
terraform apply -auto-approve
```
*Observed Output*:
`Apply complete! Resources: 2 added, 0 changed, 0 destroyed.`

### Step 13.2: Verify Application Restoration
1. Access the newly created Worker URL.
2. The Student Task Manager interface loads immediately.
3. Add a fresh task; verify that the new KV namespace stores the record and returns HTTP `201 Created`.

---

## 14. Results, Limitations, and Conclusion

### 14.1 Results Achieved
- Successfully implemented an automated serverless deployment using pure Infrastructure as Code (Terraform).
- Zero manual resource creation on the Cloudflare dashboard.
- Verified full CRUD capabilities across 5 REST API endpoints.
- Implemented automated CI/CD deployment with GitHub Actions.
- Confirmed full lifecycle repeatability (create, modify, destroy, and recreate).

### 14.2 Limitations
1. **Workers KV Eventual Consistency**: Cloudflare Workers KV is optimized for high-read throughput. In rare instances of high-concurrency writes, updates can take up to 60 seconds to propagate to all global edge nodes.
2. **Free Tier Request Caps**: Cloudflare Free plan allows 100,000 Worker requests/day and 1,000 KV write operations/day.
3. **Ephemeral CI/CD Runners**: Running Terraform in GitHub Actions without a configured remote backend (such as Cloudflare R2 or Terraform Cloud) loses state between runs.

### 14.3 Conclusion
This project demonstrates the immense power of combining modern Serverless Edge Computing with declarative Infrastructure as Code. By eliminating physical servers, container runtimes, and manual dashboard administration, cloud applications can achieve global scalability, sub-50ms response times, and 100% reproducible environments.

---

## 15. Required Screenshots Checklist

Capture the following screenshots in this exact sequence for your project report and viva presentation. Save all images in the `screenshots/` directory.

| # | Exact Screenshot Item | Recommended Filename | Clear Capture Instructions (What to Capture Yourself) |
| :-: | :--- | :--- | :--- |
| **1** | **Project folder structure** | `01_project_folder_structure.png` | Open VS Code / IDE showing the file explorer expanded: `application/`, `terraform/`, `.github/workflows/`, `screenshots/`, and root files. |
| **2** | **Working application with tasks displayed** | `02_working_application_dashboard.png` | Open the browser at `http://localhost:3000` or the live Worker URL showing at least 2–3 tasks displayed with KPI metric cards populated. |
| **3** | **Successful task creation, status update, and deletion** | `03_task_crud_operations.png` | Capture the application interface after adding a new task (green success toast), changing a status dropdown, and deleting a task. |
| **4** | **`terraform init` and `terraform validate`** | `04_terraform_init_validate.png` | Open PowerShell in `terraform/` directory. Run `terraform init` and `terraform validate`, capturing `Success! The configuration is valid.` |
| **5** | **Initial `terraform plan`** | `05_terraform_plan_initial.png` | Terminal showing `terraform plan` output showing `Plan: 2 to add, 0 to change, 0 to destroy` and the resource breakdown. |
| **6** | **Successful `terraform apply`** | `06_terraform_apply_success.png` | Terminal showing `terraform apply` completed with `Apply complete! Resources: 2 added, 0 changed, 0 destroyed.` |
| **7** | **Terraform outputs showing deployed Worker URL** | `07_terraform_outputs_worker_url.png` | Terminal showing `terraform output` displaying `application_url_format`, `kv_namespace_id`, and `worker_script_name`. |
| **8** | **Cloudflare dashboard showing Worker and KV** | `08_cloudflare_dashboard_worker_kv.png` | Cloudflare Dashboard &rarr; **Workers & Pages** showing `student-task-manager-dev` and under **KV** showing `dev-student-tasks-kv`. |
| **9** | **Evidence of tasks stored in KV via deployed app** | `09_tasks_stored_in_kv_evidence.png` | Cloudflare Dashboard &rarr; **KV** &rarr; `dev-student-tasks-kv` &rarr; View Keys showing `task:task_...` keys and their raw JSON values. |
| **10** | **Terraform plan showing an infrastructure modification** | `10_terraform_plan_modification.png` | Terminal showing `terraform plan` after changing `tags` or `compatibility_date`, highlighting `~ update in-place` (`1 to change`). |
| **11** | **Successful application of the modification** | `11_terraform_apply_modification.png` | Terminal showing `terraform apply` success for modification: `Apply complete! Resources: 0 added, 1 changed, 0 destroyed.` |
| **12** | **GitHub repository containing source code** | `12_github_repository_code.png` | Web browser showing your GitHub repository page with all commits, `terraform/`, `application/`, and `README.md`. |
| **13** | **GitHub Actions workflow run** | `13_github_actions_workflow_run.png` | GitHub repository &rarr; **Actions** tab showing a successful workflow run with all green checkmarks on each step. |
| **14** | **`terraform plan -destroy`** | `14_terraform_plan_destroy.png` | Terminal showing `terraform plan -destroy` output indicating `Plan: 0 to add, 0 to change, 2 to destroy.` |
| **15** | **Successful `terraform destroy` and resource removal** | `15_terraform_destroy_verified.png` | Terminal showing `Destroy complete! Resources: 2 destroyed.` followed by `terraform show` returning empty. |
| **16** | **Successful recreation using plan and apply** | `16_terraform_recreate_apply.png` | Terminal showing subsequent `terraform apply` successfully recreating both resources (`2 added, 0 changed, 0 destroyed`). |
| **17** | **Working application after recreation** | `17_working_app_after_recreation.png` | Browser showing the freshly recreated Worker URL loading the functional application with newly added task. |

---

## 16. Viva Preparation & Examiner Q&A

### Q1: What is Infrastructure as Code (IaC)?
**Answer**: Infrastructure as Code is the practice of provisioning and managing computing infrastructure—such as servers, databases, and network routes—using machine-readable definition files rather than physical hardware configuration or manual web console clicking. It enables version control, automated testing, and identical environment recreation.

### Q2: Why is Terraform used in this project?
**Answer**: Terraform is an open-source, declarative Infrastructure as Code tool. We use it because:
1. It maintains a **state file** (`terraform.tfstate`) that tracks deployed resources against desired code.
2. It generates **execution plans** (`terraform plan`) so we can preview changes before touching live cloud infrastructure.
3. It supports the official Cloudflare provider, allowing us to manage serverless Workers, KV namespaces, and bindings in unified HCL code.

### Q3: What is a Cloudflare Worker?
**Answer**: A Cloudflare Worker is a serverless execution environment that runs JavaScript code at Cloudflare's edge locations across the globe. Unlike virtual machines or container services, Workers run on Google V8 isolates, which eliminates cold start latency (< 5ms) and automatically scales with inbound request traffic.

### Q4: What is Workers KV?
**Answer**: Workers KV is a globally distributed, low-latency key-value data storage system. It is designed for high-frequency read operations and stores data as key-value pairs. In our project, it stores JSON-serialized student tasks under keys formatted as `task:<task_id>`.

### Q5: Why is a KV binding required?
**Answer**: Cloudflare Workers enforce security through isolate sandboxing. A Worker script cannot access arbitrary cloud storage by default. A **KV binding** declares a named reference (in our project, `TASKS_KV`) in the Worker's environment (`env.TASKS_KV`). This provides authenticated runtime methods (`.get()`, `.put()`, `.delete()`, `.list()`) without exposing account credentials in application code.

### Q6: What is the purpose of `terraform init`, `validate`, `plan`, `apply`, and `destroy`?
**Answer**:
- `terraform init`: Initializes the project directory and downloads required provider plugins (`cloudflare/cloudflare`).
- `terraform validate`: Verifies configuration syntax and resource arguments for errors without connecting to the cloud.
- `terraform plan`: Reads current cloud state, compares it with local HCL files, and outputs the exact delta (resources to create, change, or destroy).
- `terraform apply`: Executes the changes specified in the plan against the Cloudflare API to provision or update resources.
- `terraform destroy`: Safely deletes all cloud resources managed in the Terraform state file.

### Q7: What is the difference between application code and infrastructure code?
**Answer**:
- **Application Code** (`application/`): Contains the business logic, UI, and algorithms that run the software (HTML, CSS, client JavaScript, and Worker request routing).
- **Infrastructure Code** (`terraform/`): Defines the hosting environment, compute engines, storage namespaces, and networking connections required to run that application.

### Q8: How does GitHub Actions automate deployment?
**Answer**: GitHub Actions listens for repository events (such as a `git push` to the `main` branch). When triggered, it spins up an ephemeral runner, checks out the code, securely injects credentials from GitHub Secrets, runs formatting and validation checks, executes `terraform plan`, and automatically applies the changes to Cloudflare.

### Q9: How are API credentials protected in this project?
**Answer**: Credentials are protected at multiple layers:
1. They are never written into `.tf` code or committed to Git.
2. The `variables.tf` file designates `cloudflare_api_token` as `sensitive = true`, preventing Terraform from printing it in CLI logs.
3. `.gitignore` excludes `terraform.tfvars`, `*.tfstate`, and `.env`.
4. In CI/CD, credentials are stored in encrypted **GitHub Repository Secrets** (`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`) and masked in runner logs.

### Q10: How do we prove that infrastructure was recreated rather than manually created?
**Answer**:
1. Run `terraform destroy`: Terraform uses its state file to delete all resources and leaves state completely empty (`terraform show` returns nothing).
2. Attempting to visit the Worker URL or inspect the dashboard confirms resources are gone.
3. Run `terraform apply`: Terraform re-contacts the Cloudflare API, re-creates the resources with new unique Cloudflare IDs, and prints them in the output.
4. The Git commit history and the presence of `main.tf` serve as auditable proof that all parameters originate from code.

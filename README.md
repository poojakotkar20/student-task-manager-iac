# Automated Deployment of a Serverless Student Task Management Application Using Terraform-Based Infrastructure as Code

[![Terraform](https://img.shields.io/badge/Terraform-v1.16+-623CE4?logo=terraform&logoColor=white)](https://www.terraform.io/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers%20%26%20KV-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![CI/CD](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-2088FF?logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![License](https://img.shields.io/badge/Academic-College%20Mini--Project-10B981)](#)

---

## 1. Executive Summary & Objective

This project implements an automated, production-ready **Serverless Student Task Management Application** provisioned entirely via **Terraform-Based Infrastructure as Code (IaC)** on the **Cloudflare Free tier**. 

The primary academic and practical evaluation objective is **Infrastructure as Code (IaC)**: automating the provisioning, configuration, modification, destruction, and recreation of cloud resources rather than relying on manual dashboard actions.

### Core Evaluation Highlights:
* **Zero Manual Provisioning:** Cloudflare Worker, KV Namespace, and Worker-to-KV bindings are created exclusively via Terraform.
* **Persistent Storage:** Cloudflare Workers KV stores and retrieves task records with low-latency global distribution.
* **Full REST API Suite:** Standardized CRUD endpoints for student tasks (`GET`, `POST`, `PUT`, `DELETE`).
* **CI/CD Pipeline:** Fully automated deployment pipeline using GitHub Actions that formats, validates, plans, and applies infrastructure on Git push.
* **Security & Clean Code:** Strict segregation of credentials using environment variables and `.tfvars` excluded from Git version control.

---

## 2. Architecture & Data Flow

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

---

## 3. Repository Directory Structure

```
student-task-manager-iac/
├── application/
│   ├── index.html            # Responsive frontend dashboard with glassmorphism UI
│   ├── style.css             # Modern dark-theme stylesheet with design tokens
│   ├── script.js             # Client logic handling REST API calls & DOM updates
│   └── worker.js             # Cloudflare Worker script serving UI & REST endpoints
├── terraform/
│   ├── providers.tf          # Terraform block and Cloudflare provider declarations
│   ├── main.tf               # IaC resources (Workers KV, Worker script, KV binding)
│   ├── variables.tf          # Input variable schemas and validation rules
│   ├── outputs.tf            # Output values (KV ID, Worker name, endpoints)
│   └── terraform.tfvars.example # Safe template for required credentials
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions CI/CD automation workflow
├── screenshots/
│   └── README.md             # Guide for viva evaluation screenshots
├── .gitignore                # Protects secrets, state files, and build artifacts
└── README.md                 # Complete project documentation and execution guide
```

### Purpose of Major Files:
1. **`application/worker.js`**: Core serverless engine. Listens for HTTP requests. When routes match `/api/tasks*`, it executes CRUD operations on `env.TASKS_KV`. When routes match `/`, it serves the frontend assets.
2. **`application/index.html`**: Semantic single-page dashboard featuring KPI counters, quick task creation, live status indicators, search, priority filter, and inspection modals.
3. **`application/style.css`**: Vanilla CSS adhering to modern aesthetics (deep obsidian palette, translucent glassmorphism surfaces, subtle glow gradients, and responsive grid layouts).
4. **`application/script.js`**: Asynchronous JavaScript handling form submissions, API requests, toast notifications, status cycling, and modal lifecycles.
5. **`terraform/providers.tf`**: Pinpoints required Terraform version (`>= 1.5.0`) and the official `cloudflare/cloudflare` provider (`~> 4.45.0`).
6. **`terraform/main.tf`**: Defines the target infrastructure:
   * `cloudflare_workers_kv_namespace.tasks_kv`: Allocates the persistent distributed key-value namespace.
   * `cloudflare_workers_script.task_manager`: Packages and deploys the worker code with the `kv_namespace_binding` block connecting `TASKS_KV` to the KV namespace ID.
7. **`terraform/variables.tf`**: Enforces strict typing for `cloudflare_api_token`, `cloudflare_account_id`, `environment`, and `worker_name`.
8. **`terraform/outputs.tf`**: Exposes vital deployment data after `terraform apply` (KV Namespace ID, script name, live URL patterns).
9. **`.github/workflows/deploy.yml`**: Defines a 7-step CI/CD pipeline executing `terraform fmt -check`, `init`, `validate`, `plan`, and `apply` upon commits to the `main` branch.

---

## 4. Student Task Data Schema

Each student task stored in Cloudflare Workers KV is serialized as a JSON object adhering to this schema:

| Property | Data Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `String` | Yes | Unique ID generated upon creation | `task_1728912345_a1b2c` |
| `title` | `String` | Yes | Task title / description | `"Submit Cloud Computing Lab Assignment"` |
| `priority` | `String` | Yes | Priority level (`Low`, `Medium`, `High`) | `"High"` |
| `status` | `String` | Yes | Lifecycle status (`Pending`, `In Progress`, `Completed`) | `"Pending"` |
| `createdAt` | `String` | Yes | ISO 8601 creation timestamp | `"2026-10-14T13:00:00.000Z"` |
| `updatedAt` | `String` | Yes | ISO 8601 last modified timestamp | `"2026-10-14T13:15:00.000Z"` |

---

## 5. REST API Specification

### Base Path: `/api/tasks`

#### 1. Retrieve All Tasks
* **Method:** `GET`
* **Path:** `/api/tasks`
* **Response:** `200 OK`
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "task_1728912345_a1b2c",
      "title": "Submit Cloud Computing Lab Assignment",
      "priority": "High",
      "status": "In Progress",
      "createdAt": "2026-10-14T13:00:00.000Z",
      "updatedAt": "2026-10-14T13:15:00.000Z"
    }
  ]
}
```

#### 2. Create a New Task
* **Method:** `POST`
* **Path:** `/api/tasks`
* **Headers:** `Content-Type: application/json`
* **Payload:**
```json
{
  "title": "Prepare Seminar Presentation on Terraform IaC",
  "priority": "High",
  "status": "Pending"
}
```
* **Response:** `201 Created`
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "task_1728912999_x9y8z",
    "title": "Prepare Seminar Presentation on Terraform IaC",
    "priority": "High",
    "status": "Pending",
    "createdAt": "2026-10-14T13:20:00.000Z",
    "updatedAt": "2026-10-14T13:20:00.000Z"
  }
}
```

#### 3. Retrieve a Single Task by ID
* **Method:** `GET`
* **Path:** `/api/tasks/{id}`
* **Response:** `200 OK` (or `404 Not Found`)
```json
{
  "success": true,
  "data": {
    "id": "task_1728912999_x9y8z",
    "title": "Prepare Seminar Presentation on Terraform IaC",
    "priority": "High",
    "status": "Pending",
    "createdAt": "2026-10-14T13:20:00.000Z",
    "updatedAt": "2026-10-14T13:20:00.000Z"
  }
}
```

#### 4. Update a Task
* **Method:** `PUT`
* **Path:** `/api/tasks/{id}`
* **Payload:**
```json
{
  "status": "Completed"
}
```
* **Response:** `200 OK`
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "id": "task_1728912999_x9y8z",
    "title": "Prepare Seminar Presentation on Terraform IaC",
    "priority": "High",
    "status": "Completed",
    "createdAt": "2026-10-14T13:20:00.000Z",
    "updatedAt": "2026-10-14T13:30:00.000Z"
  }
}
```

#### 5. Delete a Task
* **Method:** `DELETE`
* **Path:** `/api/tasks/{id}`
* **Response:** `200 OK`
```json
{
  "success": true,
  "message": "Task with ID \"task_1728912999_x9y8z\" was deleted successfully."
}
```

---

## 6. Step-by-Step Deployment & Evaluation Guide

### Step 1: Obtain Cloudflare Credentials (1-Minute Setup)
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) (Free plan).
2. **Find Account ID**:
   * Navigate to **Workers & Pages** in the left sidebar.
   * On the right sidebar, locate **Account ID** and click to copy.
3. **Create API Token**:
   * Click your user profile icon (top right) &rarr; **My Profile** &rarr; **API Tokens**.
   * Click **Create Token** &rarr; select **Create Custom Token** &rarr; **Get started**.
   * Name your token: `terraform-task-manager-token`.
   * Under **Permissions**, add:
     * **Account** &bull; **Workers Scripts** &bull; **Edit**
     * **Account** &bull; **Workers KV Storage** &bull; **Edit**
     * **Account** &bull; **Account Settings** &bull; **Read**
   * Under **Account Resources**, choose **Include** &bull; **All accounts** (or your specific account).
   * Click **Continue to summary** &rarr; **Create Token**.
   * Copy your API Token (Cloudflare will display it only once).

---

### Step 2: Configure Local Terraform Variables
In your terminal, navigate to the `terraform/` folder:

```bash
cd "student-task-manager-iac/terraform"
```

Create your private `terraform.tfvars` file from the example:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Open `terraform.tfvars` in your editor and insert your actual Cloudflare credentials:

```hcl
cloudflare_account_id = "your_actual_account_id_here"
cloudflare_api_token  = "your_actual_api_token_here"
environment           = "dev"
worker_name           = "student-task-manager"
```

*(Note: `terraform.tfvars` is automatically ignored by `.gitignore` so your secret token will never be committed to Git).*

---

### Step 3: Demonstrate the 8 Terraform Lifecycle Phases (College Viva Demo)

#### Phase 1: Code Formatting Validation
Ensures clean, canonical Terraform code formatting:
```bash
terraform fmt -check
```

#### Phase 2: Provider Initialization
Downloads and installs the pinned Cloudflare Terraform provider:
```bash
terraform init
```
*Expected Output:* `Terraform has been successfully initialized!`

#### Phase 3: Configuration Syntax Validation
Validates internal consistency and resource arguments:
```bash
terraform validate
```
*Expected Output:* `Success! The configuration is valid.`

#### Phase 4: Speculative Execution Plan
Generates an execution plan showing exactly what resources will be created without modifying the cloud:
```bash
terraform plan
```
*Expected Output:* `Plan: 2 to add, 0 to change, 0 to destroy.`
* `cloudflare_workers_kv_namespace.tasks_kv` (KV Namespace)
* `cloudflare_workers_script.task_manager` (Worker Script + Binding)

#### Phase 5: Infrastructure Application (Creation)
Applies the plan and provisions live infrastructure on Cloudflare:
```bash
terraform apply -auto-approve
```
*Expected Output:* `Apply complete! Resources: 2 added, 0 changed, 0 destroyed.` along with output values showing your Worker name and KV ID.

#### Phase 6: Cloudflare Dashboard Read-Only Verification
* Log into the Cloudflare Dashboard.
* Verify under **Workers & Pages**: `student-task-manager-dev` is active.
* Verify under **Workers & Pages > KV**: `dev-student-tasks-kv` is created.
* Note: As required by the evaluation rules, do NOT create or edit resources in the dashboard.

#### Phase 7: Infrastructure Modification
To demonstrate IaC mutability:
1. Open `terraform.tfvars` and change `environment = "staging"` (or edit `variables.tf`).
2. Run `terraform plan` and `terraform apply`.
3. Notice that Terraform automatically creates the staging resources and handles updates declaratively!

#### Phase 8: Infrastructure Teardown & Recreation
Demonstrates complete automated lifecycle control:
```bash
# Clean Teardown
terraform destroy -auto-approve

# Immediate Recreation
terraform apply -auto-approve
```

---

## 7. Automated CI/CD Pipeline (GitHub Actions)

This repository includes a production-grade GitHub Actions workflow in `.github/workflows/deploy.yml`.

### Setting Up Secrets in GitHub:
1. Push this repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "feat: Automated deployment of serverless student task manager via Terraform"
   git branch -M main
   git remote add origin https://github.com/<your-username>/student-task-manager-iac.git
   git push -u origin main
   ```
2. In your GitHub repository:
   * Go to **Settings** &rarr; **Secrets and variables** &rarr; **Actions**.
   * Click **New repository secret**.
   * Add Secret 1:
     * Name: `CLOUDFLARE_API_TOKEN`
     * Value: `<Your Cloudflare API Token>`
   * Add Secret 2:
     * Name: `CLOUDFLARE_ACCOUNT_ID`
     * Value: `<Your Cloudflare Account ID>`
3. Any push to `main` will automatically trigger the GitHub Actions workflow, running format check, initialization, validation, speculative plan, and deployment!

---

## 8. Local Development & Testing

You can also run and preview the application locally before deploying:

1. Open `application/index.html` directly in your browser or serve via any static web server:
   ```bash
   npx serve application
   ```
2. If testing locally against your deployed Cloudflare Worker, click the **Settings** gear icon in the top right corner of the web interface and enter your deployed Worker URL (e.g., `https://student-task-manager-dev.<subdomain>.workers.dev`).
3. Create, inspect, update, and delete tasks directly from the user interface.

---

## 9. Viva / Evaluation FAQ

**Q1: Why use Terraform instead of deploying via the Cloudflare Dashboard or Wrangler CLI?**
* **Answer:** Terraform provides declarative Infrastructure as Code (IaC). It manages resource state, tracks changes, prevents configuration drift, supports reproducible environments (`dev`, `staging`, `prod`), enables automated CI/CD pipelines, and allows predictable teardowns with `terraform destroy`.

**Q2: How does the Worker communicate with Cloudflare Workers KV?**
* **Answer:** Terraform establishes a `kv_namespace_binding` block inside `cloudflare_workers_script`. This binds the KV namespace ID to the variable `TASKS_KV`, making it accessible inside the Worker runtime via `env.TASKS_KV`.

**Q3: How are frontend assets served serverlessly?**
* **Answer:** Terraform reads `index.html`, `style.css`, and `script.js` during compilation and safely injects them into the Worker script. When a user requests the root route (`/`), the Worker returns the HTML directly from edge nodes with sub-50ms latency.

**Q4: How are secrets kept secure?**
* **Answer:** The Cloudflare API token is declared as `sensitive = true` in `variables.tf`, stored in `terraform.tfvars` (which is excluded from Git via `.gitignore`), and injected in CI/CD via encrypted GitHub Secrets.

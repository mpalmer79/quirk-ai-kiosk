## 🚀 QUIRK AI Kiosk Project

This is the official repository for the **QUIRK AI Kiosk**—a next-generation, AI-powered car dealership showroom application.

The project is structured as a **Monorepo**, housing three interconnected services: the Kiosk User Interface (Frontend), the API Gateway (Backend), and the Vehicle Recommendation Engine (AI Service).

---

## 🏗️ Project Architecture Overview

| Component | Role | Technology | Deployment Strategy |
| :--- | :--- | :--- | :--- |
| **Frontend** | The customer-facing, locked-down UI running on the physical kiosk display. | **React, JavaScript** | Built artifact deployed to physical kiosks via a Device Management Platform (DMP). |
| **Backend Gateway** | Routes all Kiosk requests, manages security, and handles integration with external systems. | **Python (FastAPI)** | Containerized deployment (Docker) to a cloud server. |
| **AI Service** | Serves real-time vehicle recommendations and predictive pricing models. | **Python (Scikit-learn, Pandas)** | Containerized deployment (Docker) to a high-performance serving platform. |

---

## 📂 Repository Structure

The project uses a clear monorepo layout to isolate dependencies and deployments:

---

## 🛠️ Getting Started (Local Development)

To run the full QUIRK AI system locally, you will need **Docker** and **Docker Compose** installed.

### 1. Configure Local Secrets

**Security Note:** We do **not** commit actual API keys. For local testing, create the following environment files in their respective directories and populate them with **MOCK data** or local development keys:

* **`/backend/.env.development`**
    * `PBS_API_KEY=mock-pbs-key-dev`
    * `CRM_API_KEY=mock-crm-key-dev`
* **`/frontend/.env.development`**
    * `REACT_APP_API_URL=http://localhost:8000/api/v1` (The Backend Gateway address)

### 2. Mock Data Initialization

The system currently relies on the **Mock Data Model** defined for the PBS Inventory API integration. Ensure a mock JSON file is available within the **`/backend`** directory that contains the structure described in the planning phase.

### 3. Build and Run Services

Use Docker Compose to build and start all three services simultaneously:

```bash
docker-compose build
docker-compose up
ServiceLocal URLBackend Gatewayhttp://localhost:8000Frontend Kiosk UIhttp://localhost:3000AI ServiceInternal (not publicly exposed)

Markdown## 🚀 QUIRK AI Kiosk Project

This is the official repository for the **QUIRK AI Kiosk**—a next-generation, AI-powered car dealership showroom application.

The project is structured as a **Monorepo**, housing three interconnected services: the Kiosk User Interface (Frontend), the API Gateway (Backend), and the Vehicle Recommendation Engine (AI Service).

---

## 🏗️ Project Architecture Overview

| Component | Role | Technology | Deployment Strategy |
| :--- | :--- | :--- | :--- |
| **Frontend** | The customer-facing, locked-down UI running on the physical kiosk display. | **React, JavaScript** | Built artifact deployed to physical kiosks via a Device Management Platform (DMP). |
| **Backend Gateway** | Routes all Kiosk requests, manages security, and handles integration with external systems. | **Python (FastAPI)** | Containerized deployment (Docker) to a cloud server. |
| **AI Service** | Serves real-time vehicle recommendations and predictive pricing models. | **Python (Scikit-learn, Pandas)** | Containerized deployment (Docker) to a high-performance serving platform. |

---

## 📂 Repository Structure

The project uses a clear monorepo layout to isolate dependencies and deployments:

quirk-ai-kiosk/├── .github/              # GitHub Actions CI/CD Workflows├── frontend/             # Kiosk UI (React)├── backend/              # API Gateway (FastAPI)├── ai_service/           # ML Model Serving Logic├── .gitignore            # Combined for Python, Node, and security├── README.md             # This file└── docker-compose.yml    # For running all services locally
---

## 🛠️ Getting Started (Local Development)

To run the full QUIRK AI system locally, you will need **Docker** and **Docker Compose** installed.

### 1. Configure Local Secrets

**Security Note:** We do **not** commit actual API keys. For local testing, create the following environment files in their respective directories and populate them with **MOCK data** or local development keys:

* **`/backend/.env.development`**
    * `PBS_API_KEY=mock-pbs-key-dev`
    * `CRM_API_KEY=mock-crm-key-dev`
* **`/frontend/.env.development`**
    * `REACT_APP_API_URL=http://localhost:8000/api/v1` (The Backend Gateway address)

### 2. Mock Data Initialization

The system currently relies on the **Mock Data Model** defined for the PBS Inventory API integration. Ensure a mock JSON file is available within the **`/backend`** directory that contains the structure described in the planning phase.

### 3. Build and Run Services

Use Docker Compose to build and start all three services simultaneously:

```bash
docker-compose build
docker-compose up
ServiceLocal URLBackend Gatewayhttp://localhost:8000Frontend Kiosk UIhttp://localhost:3000AI ServiceInternal (not publicly exposed)🧩 Core Integration Points1. DMS Inventory Integration (PBS)API Target: PBS Dealer Management Systems (DMS) Partner HUB.Protocol: Simulated via RESTful JSON in the mock phase; actual integration will use the required PBS protocol (e.g., SOAP/XML/JSON HTTP Posts).Data Flow: The Backend Gateway translates the proprietary PBS data structure into the standardized internal Vehicle object schema used by the Frontend and the AI Service.2. Foundational Recommendation ModelType: Initial model is Content-Based Filtering.Goal: Recommend vehicles that share key characteristics (Make, Body Style, Price Range) with the vehicle a customer is currently viewing on the Kiosk UI.🛡️ Licensing and SecurityLicenseThis project currently uses the MIT License for its core structure, providing maximum flexibility for internal use and integration with open-source libraries. Note: Due to the commercial nature of the Backend Gateway and AI Service, these components may transition to a Proprietary License upon full commercial deployment.Security Best PracticesSecrets Management: API keys and sensitive credentials are never committed to the repository. They are managed locally via .env files (ignored by Git) and in production via GitHub Actions Secrets.Git LFS: The /ai_service/models directory uses Git LFS (Large File Storage) to track trained model file versions without bloating the main repository.

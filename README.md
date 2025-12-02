# 🚀 Quirk AI Kiosk  
A next-generation AI-powered showroom experience for Quirk dealerships.

The **Quirk AI Kiosk** is a unified, production-ready monorepo that powers an interactive in-store kiosk experience. Customers can browse inventory, compare vehicles, submit leads, and receive AI-generated vehicle recommendations — all through a secure, locked-down touchscreen interface.

This repo contains **three major services**:

1. **Frontend Kiosk App** (React)
2. **Backend Gateway API** (FastAPI)
3. **AI Recommendation Service** (Python)

---

# 🏗️ Architecture Overview

| Component | Purpose | Tech Stack | Deployment |
|----------|---------|------------|-------------|
| **Frontend** | Customer-facing kiosk UI | React, Vite, Tailwind | Bundled + deployed to kiosk devices (DMP) |
| **Backend Gateway** | API routing, auth, logging, lead submission | FastAPI, Python | Docker container on central server |
| **AI Service** | Real-time vehicle recommendation engine | Python, custom ML model | Docker container on high-performance node |

All services communicate over **internal REST endpoints**. The system is deployed using a modular multi-container design.

---

# 📁 Project Structure

```
quirk-ai-kiosk/
│
├── frontend/               # React Kiosk UI
│   ├── public/
│   ├── src/
│   ├── Dockerfile
│   └── .env.development
│
├── backend/                # API Gateway
│   ├── app/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.development
│
├── ai_service/             # Vehicle Recommendation Engine
│   ├── predictor/
│   ├── models/
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml
├── README.md
└── LICENSE
```

---

# ⚙️ Local Development Setup

You’ll need:

- Docker
- Docker Compose
- Node 18+ (optional if you want to run frontend natively)

### 1. Create Local Environment Files

#### **`backend/.env.development`**
```
PBS_API_KEY=mock-pbs-key-dev
CRM_API_KEY=mock-crm-key-dev
LOG_LEVEL=info
```

#### **`frontend/.env.development`**
```
REACT_APP_API_URL=http://localhost:8000/api/v1
```

#### **`ai_service/.env.development`**
```
MODEL_PATH=./models/default-model.pkl
```

> Production secrets are not stored here. These values are mock-key safe defaults for local use.

---

# 🧪 Running the Entire Stack (Local Demo)

From the repo root:

```bash
docker-compose build
docker-compose up
```

After startup:

| Service | Local URL |
|---------|-----------|
| **Frontend** | http://localhost:3000 |
| **Backend Gateway** | http://localhost:8000 |
| **AI Service** | http://localhost:5000 |

---

# 🔧 Running Services Individually

### Frontend
```
cd frontend
npm install
npm run dev
```

### Backend Gateway
```
cd backend
uvicorn app.main:app --reload --port 8000
```

### AI Recommender
```
cd ai_service
python predictor/server.py
```

---

# 🤖 Vehicle Recommendation Engine

The AI service consumes structured inventory data and customer preference signals to generate:

- Ranked vehicle recommendations  
- Similar-vehicle suggestions  
- Feature-weighted scoring outputs  

Model files are stored separately to keep the repo lightweight.

---

# 🧱 Production Deployment Strategy

- **Kiosk Frontend**  
  Bundled and deployed through the dealership’s Device Management Platform (DMP). Runs in secure kiosk-mode.

- **Backend Gateway**  
  Docker container deployed to Quirk’s internal server environment.

- **AI Service**  
  Runs in an isolated container on a dedicated compute node for real-time inference.

- **Logging**  
  Centralized logging (stdout + gateway instrumentation) for audit and improvement.

---

# 📦 Data & Mocking

Local development uses:

- Mock PBS inventory data  
- Mock CRM lead submission  
- Local fallback model  

This allows full kiosk simulation with zero external dependencies.

---

# 🧭 Roadmap

- 🔒 Full auth handshake (kiosk → gateway)  
- 📈 Dealer-specific recommendation tuning  
- ⚡ PBS real-time inventory sync  
- 📤 Automated CRM lead submission  
- 🖼 Enhanced comparison UI  

---

# 📝 License

This project is licensed under the **MIT License**.

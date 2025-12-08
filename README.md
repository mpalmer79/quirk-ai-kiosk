# QUIRK AI Kiosk

**AI-Powered Showroom Experience for Quirk Auto Dealers**

An interactive in-store kiosk system that enables customers to browse inventory, compare vehicles, get AI-powered recommendations, estimate trade-in values, and calculate payments — all through a touchscreen interface designed for the dealership showroom floor.

[![Backend CI](https://github.com/mpalmer79/quirk-ai-kiosk/actions/workflows/ci-backend.yml/badge.svg)](https://github.com/mpalmer79/quirk-ai-kiosk/actions/workflows/ci-backend.yml)
[![Frontend CI](https://github.com/mpalmer79/quirk-ai-kiosk/actions/workflows/ci-frontend.yml/badge.svg)](https://github.com/mpalmer79/quirk-ai-kiosk/actions/workflows/ci-frontend.yml)

---

## Overview

The QUIRK AI Kiosk is a production-ready monorepo powering Quirk Auto Dealers' in-store customer experience. The system is designed with the understanding that **the customer is already in the showroom** — the AI assistant acts as a knowledgeable salesperson, not a website chatbot.

### Key Features

| Feature | Description |
|---------|-------------|
| **AI Sales Assistant** | Claude-powered conversational AI with text-to-speech, voice input, and smart inventory search |
| **Smart Recommendations** | Entity extraction from conversations with weighted similarity scoring |
| **Live Inventory** | Real-time PBS inventory integration with 250+ Chevrolet vehicles |
| **Trade-In Estimator** | 5-step guided flow with VIN decode, payoff/lender capture, condition rating, and photo upload |
| **Payment Calculator** | Finance and lease calculators with real-time payment estimates |
| **Sales Manager Dashboard** | Real-time 4-square worksheet with chat transcript viewing and session monitoring |
| **Model Budget Selector** | Visual model selection with cab type, color preferences, and budget filtering |
| **Stock Lookup** | Direct stock number search for quick vehicle access |
| **Protection Packages** | F&I product presentation for GAP, extended warranty, and maintenance plans |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        QUIRK AI KIOSK                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │    │   Backend    │    │  AI Service  │      │
│  │    (React)   │◄──►│  (FastAPI)   │◄──►│   (Python)   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Railway/    │    │  PostgreSQL  │    │   Claude     │      │
│  │  Vercel      │    │  + JSON FB   │    │   API        │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Service | Tech Stack | Deployment | URL |
|---------|------------|------------|-----|
| **Frontend** | React 18, TypeScript, Tailwind | Railway | `quirk-frontend-production.up.railway.app` |
| **Backend** | FastAPI 0.100+, Python 3.11 | Railway | `quirk-backend-production.up.railway.app` |
| **AI Service** | Anthropic Claude API | Integrated | Via Backend |
| **Database** | PostgreSQL (prod) / JSON (fallback) | Railway | Managed |

---

## Project Structure

```
quirk-ai-kiosk/
├── frontend/                    # React Kiosk Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIAssistant.tsx         # Claude-powered chat with voice & TTS
│   │   │   ├── Kioskapp.tsx            # Main kiosk container & routing
│   │   │   ├── Inventoryresults.tsx    # Vehicle grid with filtering
│   │   │   ├── Vehicledetail.tsx       # Individual vehicle view
│   │   │   ├── VehicleCard.tsx         # Reusable vehicle display card
│   │   │   ├── ModelBudgetSelector.tsx # Model/cab/color/budget flow
│   │   │   ├── TradeInestimator.tsx    # 5-step trade-in with photo upload
│   │   │   ├── Paymentcalculator.js    # Finance/lease calculator
│   │   │   ├── Protectionpackages.tsx  # F&I product presentation
│   │   │   ├── SalesManagerDashboard.tsx # Admin 4-square worksheet
│   │   │   ├── Stocklookup.tsx         # Stock number search
│   │   │   ├── Trafficlog.tsx          # Session analytics view
│   │   │   ├── Welcomescreen.tsx       # Kiosk entry point
│   │   │   ├── Guidedquiz.js           # Interactive needs assessment
│   │   │   ├── Customerhandoff.js      # Sales team notification
│   │   │   ├── LeadForm.js             # Customer info capture
│   │   │   └── api.ts                  # Typed API client layer
│   │   ├── __tests__/                  # Jest test suite
│   │   ├── types/                      # TypeScript definitions
│   │   ├── hooks/                      # Custom React hooks
│   │   ├── data/                       # Quiz questions, payment options
│   │   └── utils/                      # Vehicle helpers
│   ├── public/images/vehicles/         # Color-specific vehicle images
│   ├── Dockerfile
│   └── package.json
│
├── backend/                     # FastAPI Backend Service
│   ├── app/
│   │   ├── main.py                     # FastAPI v2.2.0 entry point
│   │   ├── database.py                 # PostgreSQL + JSON fallback
│   │   ├── config.py                   # Environment configuration
│   │   ├── core/
│   │   │   └── recommendation_engine.py # Weighted similarity scoring
│   │   ├── routers/
│   │   │   ├── inventory.py            # /api/v1/inventory
│   │   │   ├── ai.py                   # /api/v1/ai (Claude chat)
│   │   │   ├── ai_v2.py                # /api/v2/ai (structured outputs)
│   │   │   ├── recommendations.py      # /api/v1/recommendations
│   │   │   ├── recommendations_v2.py   # /api/v2/recommendations
│   │   │   ├── smart_recommendations.py # /api/v3/smart (AI-enhanced)
│   │   │   ├── leads.py                # Lead submission & handoff
│   │   │   ├── analytics.py            # Analytics endpoints
│   │   │   └── traffic.py              # Session tracking & dashboard
│   │   ├── services/
│   │   │   ├── entity_extraction.py    # NLP entity extraction
│   │   │   ├── inventory_enrichment.py # Derive missing vehicle fields
│   │   │   └── smart_recommendations.py # Conversation-aware recs
│   │   ├── models/
│   │   │   └── traffic_session.py      # Session data models
│   │   └── repositories/
│   │       ├── memory_repository.py    # In-memory storage
│   │       └── sqlite_repository.py    # SQLite fallback
│   ├── config/
│   │   └── recommender_config.json     # Recommendation weights
│   ├── data/
│   │   └── inventory.xlsx              # PBS inventory data
│   ├── tests/                          # Pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
│
├── ai_service/                  # Standalone AI Service (Optional)
│   ├── predictor/
│   │   └── server.py
│   └── Dockerfile
│
├── .github/workflows/           # CI/CD pipelines
│   ├── ci-backend.yml
│   ├── ci-frontend.yml
│   └── ci-ai-service.yml
│
├── docker-compose.yml
└── README.md
```

---

## API Reference

### V1 Endpoints (Core)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/inventory` | GET | List all vehicles with filtering |
| `/api/v1/inventory/stock/{stock_number}` | GET | Get vehicle by stock number |
| `/api/v1/inventory/vin/{vin}` | GET | Get vehicle by VIN |
| `/api/v1/inventory/search` | POST | Search with preferences |
| `/api/v1/inventory/stats` | GET | Inventory statistics |
| `/api/v1/recommendations/{stock_number}` | GET | Similar vehicle recommendations |
| `/api/v1/ai/chat` | POST | AI assistant conversation |
| `/api/v1/leads/handoff` | POST | Submit customer lead |
| `/api/v1/leads/test-drive` | POST | Schedule test drive |
| `/api/v1/traffic/session` | POST | Log/update kiosk session |
| `/api/v1/traffic/log` | GET | Get session history (admin) |
| `/api/v1/traffic/stats` | GET | Traffic statistics |
| `/api/v1/traffic/active` | GET | Active sessions for dashboard |

### V2 Endpoints (Enhanced)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v2/ai/chat` | POST | Structured AI responses with intent detection |
| `/api/v2/recommendations/{stock_number}` | GET | Enhanced recommendations |
| `/api/v2/recommendations/personalized` | POST | Browsing history-based recommendations |

### V3 Endpoints (Smart AI)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v3/smart/from-conversation` | POST | Recommendations from chat context |
| `/api/v3/smart/similar/{stock_number}` | POST | AI-enhanced similar vehicles |
| `/api/v3/smart/extract-entities` | POST | Extract budget, preferences from text |

### Interactive Documentation

- **Swagger UI**: `https://quirk-backend-production.up.railway.app/docs`
- **ReDoc**: `https://quirk-backend-production.up.railway.app/redoc`

---

## Component Features

### AI Assistant (AIAssistant.tsx)

- Claude-powered natural language conversation
- **Text-to-Speech**: Audio responses for accessibility
- **Voice Input**: Speech recognition for hands-free interaction
- **Smart Inventory Search**: Color + model keyword extraction (e.g., "blue Equinox")
- **Entity Extraction**: Automatically captures budget, preferences, trade-in details
- **Suggested Prompts**: Pre-built conversation starters
- **Vehicle Cards**: Inline vehicle recommendations with direct navigation

### Trade-In Estimator (TradeInestimator.tsx)

5-step guided flow:
1. **Vehicle Info**: Year, make, model, trim, mileage, VIN decode
2. **Ownership**: Payoff status (owned outright vs. financed/leased)
3. **Payoff Details**: Amount owed, monthly payment, lender selection
4. **Condition**: 4-tier rating (Excellent/Good/Fair/Poor) with photo upload
5. **Results**: Estimate range with equity calculation

Key features:
- VIN auto-decode via NHTSA API
- 15+ major lender presets
- Photo documentation for 5 vehicle angles
- Equity preview (estimate - payoff)
- Data flows to Sales Manager Dashboard

### Sales Manager Dashboard (SalesManagerDashboard.tsx)

- **Real-time Session List**: Active kiosk sessions with auto-refresh (5s)
- **4-Square Worksheet**: Traditional deal structure view
  - Vehicle Interest: Model, cab, colors selected
  - Budget: Min/max range, down payment percentage
  - Trade-In: Vehicle details, payoff amount, monthly payment, lender
  - Selected Vehicle: Stock, year, make, model, trim, price
- **Chat Transcript Viewer**: Full AI conversation history per session
- **Customer Info Bar**: Name, phone, session timing
- **Step Tracking**: Human-readable step labels

### Model Budget Selector (ModelBudgetSelector.tsx)

- Visual model tile selection (Trucks, SUVs, Cars, Electric)
- Cab type selection for trucks (Regular, Double, Crew)
- GM color palette with color-accurate vehicle images
- Budget slider with min/max range
- Down payment percentage selector

---

## AI Features

### Conversational AI (Claude)

The AI Assistant uses Anthropic's Claude with showroom-specific behaviors:

- **Showroom Context**: Understands customer is already in-store
- **Never Says "Come In"**: AI acts as in-person salesperson
- **Trade-In Flow**: Guides through data collection without giving valuations
- **Vehicle Recommendations**: Suggests based on stated needs
- **Staff Handoff Triggers**: Detects when to involve sales, appraisal, or finance

### Entity Extraction

Structured data automatically extracted from conversations:

| Entity Type | Examples | Extracted Fields |
|-------------|----------|------------------|
| **Budget** | "under 50k", "$600/month" | max_price, monthly_payment |
| **Trade-In** | "trading my 2019 F-150" | year, make, model |
| **Payoff** | "$15k left on my loan" | payoff_amount, has_payoff |
| **Vehicle Type** | "need a truck for towing" | body_style, use_case |
| **Family Size** | "I have 3 kids" | min_seating |
| **Urgency** | "need something today" | urgency: ready_to_buy |
| **Features** | "must have leather seats" | must_have_features |
| **Fuel Preference** | "want electric" | fuel_preference |

### Smart Recommendations

Recommendations use weighted scoring across multiple factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| Body Style Match | 2.0x | SUV, Truck, Sedan alignment |
| Price Range | 1.5x | Within budget constraints |
| Fuel Type | 1.5x | Gas, Electric, Hybrid match |
| Drivetrain | 1.0x | AWD, 4WD, FWD preference |
| Feature Overlap | 1.0x | Must-have features present |
| Performance/Luxury | 0.75x | Trim level alignment |

---

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker (optional)

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000`

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`

### Environment Variables

**Frontend** (`frontend/.env.development`):
```
REACT_APP_API_URL=http://localhost:8000/api/v1
```

**Backend** (`backend/.env.development`):
```
ANTHROPIC_API_KEY=your-claude-api-key
ENVIRONMENT=development
LOG_LEVEL=info
DATABASE_URL=postgresql://user:pass@host/db  # Optional
```

### Running Tests

```bash
# Backend
cd backend
pytest -v

# Frontend
cd frontend
npm test
```

### Docker Compose

```bash
docker-compose up --build
```

---

## Deployment

### Railway (Current Production)

The project is deployed on Railway with automatic deployments from the `main` branch.

| Service | Railway URL |
|---------|-------------|
| Backend | `quirk-backend-production.up.railway.app` |
| Frontend | `quirk-frontend-production.up.railway.app` |

### CI/CD

GitHub Actions workflows handle:

- **Backend**: Lint, type check, pytest, Docker build, Railway deploy
- **Frontend**: Lint, Jest tests, build, Railway/Vercel deploy
- **AI Service**: Build and push container

---

## Inventory Data

The system loads vehicle inventory from `backend/data/inventory.xlsx` (PBS export format).

### Supported Fields

| Field | Description |
|-------|-------------|
| Stock Number | Unique identifier (e.g., M37410) |
| Year | Model year |
| Make | Manufacturer (Chevrolet) |
| Model | Vehicle model |
| Trim | Trim level |
| MSRP | Price |
| Body | Body description with drivetrain |
| Body Type | Category code (PKUP, APURP, VAN) |

### Automatic Enrichment

Missing fields are automatically derived:

- **Drivetrain**: Extracted from Body field (4WD, AWD, 2WD)
- **Fuel Type**: Detected from Model name (EV → Electric)
- **Features**: Inferred from Trim (Z71 → Off-Road Package)
- **Seating/Towing**: Looked up by model

---

## Database

The backend supports dual storage modes:

| Mode | Trigger | Use Case |
|------|---------|----------|
| **PostgreSQL** | `DATABASE_URL` env var set | Production with persistent storage |
| **JSON Fallback** | No `DATABASE_URL` | Development and stateless deploys |

Session data structure includes:
- Customer info (name, phone)
- Vehicle interest (model, cab, colors)
- Budget (min, max, down payment %)
- Trade-in (vehicle, payoff, lender, monthly payment)
- Chat history (full AI conversation)
- Selected vehicle
- Action timestamps

---

## Contributing

1. Create a feature branch from `main`
2. Make changes with appropriate tests
3. Ensure CI passes (lint, type check, tests)
4. Submit pull request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Support

For issues or questions, contact the Quirk Auto Dealers IT team.

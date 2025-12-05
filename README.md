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
| **AI Sales Assistant** | Claude-powered conversational AI that understands customer needs and recommends vehicles |
| **Smart Recommendations** | Entity extraction from conversations to provide personalized vehicle suggestions |
| **Live Inventory** | Real-time PBS inventory integration with 250+ Chevrolet vehicles |
| **Trade-In Estimator** | Guided trade-in data collection for sales team handoff |
| **Payment Calculator** | Finance and lease calculators with real-time payment estimates |
| **Sales Manager Dashboard** | Admin interface for lead management and traffic analytics |
| **Text-to-Speech** | Accessibility feature for AI responses |

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
│  │  Railway/    │    │   Railway    │    │   Claude     │      │
│  │  Vercel      │    │   Deploy     │    │   API        │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Service | Tech Stack | Deployment | URL |
|---------|------------|------------|-----|
| **Frontend** | React, TypeScript, Tailwind | Railway/Vercel | `quirk-frontend-production.up.railway.app` |
| **Backend** | FastAPI, Python 3.11 | Railway | `quirk-backend-production.up.railway.app` |
| **AI Service** | Anthropic Claude API | Integrated | Via Backend |

---

## Project Structure
```
quirk-ai-kiosk/
├── frontend/                    # React Kiosk Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIAssistant.tsx         # Claude-powered chat interface
│   │   │   ├── Kioskapp.tsx            # Main kiosk container
│   │   │   ├── Inventoryresults.tsx    # Vehicle grid display
│   │   │   ├── Vehicledetail.tsx       # Individual vehicle view
│   │   │   ├── ModelBudgetSelector.tsx # Model/budget filtering
│   │   │   ├── TradeInestimator.js     # Trade-in data collection
│   │   │   ├── Paymentcalculator.js    # Finance/lease calculator
│   │   │   ├── SalesManagerDashboard.tsx # Admin dashboard
│   │   │   ├── Stocklookup.tsx         # Stock number search
│   │   │   └── api.ts                  # API client layer
│   │   └── ...
│   ├── Dockerfile
│   └── package.json
│
├── backend/                     # FastAPI Backend Service
│   ├── app/
│   │   ├── main.py                     # FastAPI application entry
│   │   ├── core/
│   │   │   └── recommendation_engine.py # Weighted similarity scoring
│   │   ├── routers/
│   │   │   ├── inventory.py            # /api/v1/inventory
│   │   │   ├── ai.py                   # /api/v1/ai (Claude integration)
│   │   │   ├── ai_v2.py                # /api/v2/ai (structured outputs)
│   │   │   ├── recommendations.py      # /api/v1/recommendations
│   │   │   ├── recommendations_v2.py   # /api/v2/recommendations
│   │   │   ├── smart_recommendations.py # /api/v3/smart
│   │   │   ├── leads.py                # Lead submission
│   │   │   ├── analytics.py            # Analytics endpoints
│   │   │   └── traffic.py              # Traffic logging
│   │   └── services/
│   │       ├── entity_extraction.py    # NLP entity extraction
│   │       ├── inventory_enrichment.py # Derive missing vehicle fields
│   │       └── smart_recommendations.py # Conversation-aware recs
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
├── docker-compose.yml
└── README.md
```

---

## API Reference

### V1 Endpoints (Core)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/inventory` | GET | List all vehicles with filtering |
| `/api/v1/inventory/{stock_number}` | GET | Get vehicle by stock number |
| `/api/v1/inventory/search` | GET | Search inventory |
| `/api/v1/inventory/stats` | GET | Inventory statistics |
| `/api/v1/recommendations/{stock_number}` | GET | Similar vehicle recommendations |
| `/api/v1/ai/chat` | POST | AI assistant chat |
| `/api/v1/leads` | POST | Submit customer lead |
| `/api/v1/traffic/log` | POST | Log kiosk traffic |

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
```

### Running Tests
```bash
cd backend
pytest -v
```

### Docker Compose
```bash
docker-compose up --build
```

---

## AI Features

### Conversational AI (Claude)

The AI Assistant uses Anthropic's Claude to provide natural, context-aware conversations. Key behaviors:

- **Showroom Context**: Understands customer is already in-store
- **Trade-In Flow**: Guides customers through trade-in data collection without giving valuations
- **Vehicle Recommendations**: Suggests vehicles based on stated needs
- **Staff Handoff**: Triggers notifications for sales, appraisal, or finance needs

### Entity Extraction

The system automatically extracts structured data from conversations:

| Entity | Example Input | Extracted |
|--------|---------------|-----------|
| Budget | "under 50k" | `max_price: 50000` |
| Vehicle Type | "need a truck for towing" | `type: truck, use_case: towing` |
| Trade-In | "trading my 2019 F-150" | `year: 2019, make: Ford` |
| Family Size | "I have 3 kids" | `family_size: 5, min_seating: 5` |
| Urgency | "need something today" | `urgency: ready_to_buy` |

### Smart Recommendations

Recommendations use weighted scoring across:

- Body style match (2.0x weight)
- Price range similarity (1.5x)
- Fuel type match (1.5x)
- Drivetrain match (1.0x)
- Feature overlap (1.0x)
- Performance/luxury alignment (0.75x)

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

- **Backend**: Lint, test, build Docker image, deploy to Railway
- **Frontend**: Lint, test, build, deploy to Railway/Vercel
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

### Enrichment

Missing fields are automatically derived:

- **Drivetrain**: Extracted from Body field (4WD, AWD, 2WD)
- **Fuel Type**: Detected from Model name (EV → Electric)
- **Features**: Inferred from Trim (Z71 → Off-Road Package)
- **Seating/Towing**: Looked up by model

---

## Contributing

1. Create a feature branch from `main`
2. Make changes with appropriate tests
3. Ensure CI passes
4. Submit pull request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Support

For issues or questions, contact the Quirk Auto Dealers IT team.

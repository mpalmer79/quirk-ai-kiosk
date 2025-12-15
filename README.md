# QUIRK AI Kiosk

**AI-Powered Showroom Experience for Quirk Chevrolet NH**

An interactive in-store kiosk system that enables customers to browse inventory, compare vehicles, get AI-powered recommendations, estimate trade-in values, and calculate payments — all through a touchscreen interface designed for the dealership showroom floor.

[![Backend CI](https://github.com/mpalmer79/quirk-ai-kiosk/actions/workflows/ci-backend.yml/badge.svg)](https://github.com/mpalmer79/quirk-ai-kiosk/actions/workflows/ci-backend.yml)
[![Frontend CI](https://github.com/mpalmer79/quirk-ai-kiosk/actions/workflows/ci-frontend.yml/badge.svg)](https://github.com/mpalmer79/quirk-ai-kiosk/actions/workflows/ci-frontend.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/mpalmer79/quirk-ai-kiosk.git
cd quirk-ai-kiosk

# Option 1: Docker (Recommended)
docker-compose up --build

# Option 2: Manual Setup
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

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

| Service | Tech Stack | Deployment |
|---------|------------|------------|
| **Frontend** | React 18, TypeScript | Railway / Vercel / Netlify |
| **Backend** | FastAPI, Python 3.11, slowapi | Railway |
| **AI Service** | Anthropic Claude API | Integrated via Backend |
| **Database** | PostgreSQL (prod) / JSON (fallback) | Railway Managed |
| **TTS** | ElevenLabs API (optional) | Via Backend |

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
│   │   │   ├── TradeInEstimator.tsx    # 5-step trade-in with photo upload
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
│   │   ├── __tests__/                  # Jest + React Testing Library
│   │   ├── types/                      # TypeScript definitions
│   │   ├── hooks/                      # Custom React hooks
│   │   ├── data/                       # Quiz questions, payment options
│   │   └── utils/                      # Vehicle helpers
│   ├── public/images/vehicles/         # Color-specific vehicle images
│   ├── e2e/                            # Playwright E2E tests
│   ├── Dockerfile
│   └── package.json
│
├── backend/                     # FastAPI Backend Service
│   ├── app/
│   │   ├── main.py                     # FastAPI entry point (v2.3.0)
│   │   ├── database.py                 # PostgreSQL + JSON fallback
│   │   ├── config.py                   # Environment configuration
│   │   ├── core/
│   │   │   ├── recommendation_engine.py # Weighted similarity scoring
│   │   │   ├── security.py             # API key management, sanitization
│   │   │   ├── cache.py                # Response caching
│   │   │   ├── exceptions.py           # Custom exception classes
│   │   │   └── logging.py              # Structured logging
│   │   ├── routers/
│   │   │   ├── inventory.py            # /api/v1/inventory
│   │   │   ├── ai.py                   # /api/v1/ai (Claude chat)
│   │   │   ├── ai_v2.py                # /api/v2/ai (structured outputs)
│   │   │   ├── recommendations.py      # /api/v1/recommendations
│   │   │   ├── recommendations_v2.py   # /api/v2/recommendations
│   │   │   ├── smart_recommendations.py # /api/v3/smart (AI-enhanced)
│   │   │   ├── leads.py                # Lead submission & handoff
│   │   │   ├── analytics.py            # Analytics endpoints
│   │   │   ├── traffic.py              # Session tracking & dashboard
│   │   │   ├── trade_in.py             # VIN decode, valuation
│   │   │   ├── photo_analysis.py       # Trade-in photo processing
│   │   │   └── tts.py                  # ElevenLabs TTS integration
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
│   ├── models/
│   └── Dockerfile
│
├── .github/workflows/           # CI/CD pipelines
│   ├── ci-backend.yml
│   ├── ci-frontend.yml
│   ├── ci-ai-service.yml
│   └── e2e.yml
│
├── docker-compose.yml
├── LICENSE
└── README.md
```

---

## Security Features

The application implements production-grade security measures:

| Feature | Implementation |
|---------|----------------|
| **API Key Protection** | `SecretValue` wrapper prevents accidental logging of secrets |
| **Rate Limiting** | slowapi with configurable limits per endpoint |
| **Input Sanitization** | XSS prevention, control character removal, length limits |
| **CORS Configuration** | Environment-based origin allowlists (strict in production) |
| **Request Tracking** | Unique request IDs for audit trails |
| **Health Checks** | Kubernetes-ready `/live` and `/ready` endpoints |

```python
# Example: Secrets are never logged in plain text
>>> api_key = SecretValue("sk-ant-abc123...")
>>> print(api_key)
SecretValue(hash=7f3a2b1c...)
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
| `/api/v1/trade-in/decode/{vin}` | GET | Decode VIN via NHTSA |
| `/api/v1/tts/speak` | POST | Text-to-speech (ElevenLabs) |

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

### Health & Monitoring

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Comprehensive health check |
| `/api/health/live` | GET | Kubernetes liveness probe |
| `/api/health/ready` | GET | Kubernetes readiness probe |

### Interactive Documentation

- **Swagger UI**: `https://quirk-backend-production.up.railway.app/docs`
- **ReDoc**: `https://quirk-backend-production.up.railway.app/redoc`

---

## Component Features

### AI Assistant (AIAssistant.tsx)

- Claude-powered natural language conversation
- **Text-to-Speech**: ElevenLabs audio responses for accessibility
- **Voice Input**: Web Speech API for hands-free interaction
- **Smart Inventory Search**: Color + model keyword extraction (e.g., "blue Equinox")
- **Entity Extraction**: Automatically captures budget, preferences, trade-in details
- **Objection Handling**: Pre-built responses for common customer concerns
- **Suggested Prompts**: Pre-built conversation starters
- **Vehicle Cards**: Inline vehicle recommendations with direct navigation

### Trade-In Estimator (TradeInEstimator.tsx)

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
| **Lender** | "financed through Chase" | lender |
| **Vehicle Type** | "need a truck for towing" | body_style, use_case |
| **Family Size** | "I have 3 kids" | min_seating |
| **Urgency** | "need something today" | urgency: ready_to_buy |
| **Features** | "must have leather seats" | must_have_features |
| **Fuel Preference** | "want electric" | fuel_preference |
| **Drivetrain** | "need AWD for winter" | drivetrain_preference |

### Smart Recommendations

Recommendations use weighted scoring across multiple factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| Body Style Match | 2.0x | SUV, Truck, Sedan alignment |
| Price Range | 1.5x | Within budget constraints |
| Fuel Type | 1.5x | Gas, Electric, Hybrid match |
| Drivetrain | 1.0x | AWD, 4WD, FWD preference |
| Feature Overlap | 1.0x | Must-have features present |
| Performance | 0.75x | Sport/performance alignment |
| Year | 0.5x | Model year proximity |
| Luxury | 0.5x | Trim level alignment |

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
```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_KIOSK_ID=DEV-KIOSK-001
REACT_APP_DEALERSHIP=Quirk Chevrolet
```

**Backend** (`backend/.env.development`):
```env
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
ANTHROPIC_API_KEY=sk-ant-your-key-here
ELEVENLABS_API_KEY=your-elevenlabs-key        # Optional - for TTS
DATABASE_URL=postgresql://user:pass@host/db   # Optional - uses JSON fallback if not set
PBS_API_KEY=your-pbs-key                      # Optional - for live inventory
CRM_API_KEY=your-crm-key                      # Optional - for lead submission
CORS_ORIGINS=http://localhost:3000            # Comma-separated for multiple
```

### Running Tests

```bash
# Backend unit tests
cd backend
pytest -v

# Backend with coverage
pytest --cov=app --cov-report=html

# Frontend unit tests
cd frontend
npm test

# Frontend E2E tests (Playwright)
npm run test:e2e
```

### Docker Compose

```bash
# Start all services
docker-compose up --build

# Start specific service
docker-compose up backend

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

---

## Deployment

### Railway (Current Production)

The project is deployed on Railway with automatic deployments from the `main` branch.

| Service | Railway URL |
|---------|-------------|
| Backend | `quirk-backend-production.up.railway.app` |
| Frontend | `quirk-frontend-production.up.railway.app` |

### Alternative Deployment Options

**Vercel (Frontend)**
```bash
cd frontend
vercel --prod
```

**Netlify (Frontend)**
```bash
cd frontend
netlify deploy --prod
```

**Docker (Any Platform)**
```bash
# Build images
docker build -t quirk-backend ./backend
docker build -t quirk-frontend ./frontend

# Run containers
docker run -p 8000:8000 -e ANTHROPIC_API_KEY=xxx quirk-backend
docker run -p 3000:3000 quirk-frontend
```

### CI/CD

GitHub Actions workflows handle:

- **Backend** (`ci-backend.yml`): Python lint, pytest, Docker build
- **Frontend** (`ci-frontend.yml`): ESLint, Jest tests, build verification
- **AI Service** (`ci-ai-service.yml`): Build and push container
- **E2E** (`e2e.yml`): Playwright end-to-end tests

---

## Inventory Data

The system loads vehicle inventory from `backend/data/inventory.xlsx` (PBS export format).

### Supported Fields

| Field | Description | Example |
|-------|-------------|---------|
| Stock Number | Unique identifier | M37410 |
| Year | Model year | 2025 |
| Make | Manufacturer | Chevrolet |
| Model | Vehicle model | Silverado 1500 |
| Trim | Trim level | LT |
| MSRP | Price | 52000 |
| Body | Body description with drivetrain | 4WD Crew Cab 147" |
| Body Type | Category code | PKUP, APURP, VAN |

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

## Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check if port is in use
lsof -i :8000

# Verify Python version
python --version  # Should be 3.11+

# Check dependencies
pip install -r requirements.txt --upgrade
```

**Frontend API errors**
```bash
# Verify backend is running
curl http://localhost:8000/api/health

# Check CORS settings in backend/.env
CORS_ORIGINS=http://localhost:3000
```

**AI responses failing**
```bash
# Verify API key is set
echo $ANTHROPIC_API_KEY

# Check backend logs for errors
docker-compose logs backend | grep -i anthropic
```

**Database connection issues**
```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT 1"

# Fall back to JSON storage (remove DATABASE_URL)
unset DATABASE_URL
```

### Health Check Endpoints

```bash
# Full health check
curl http://localhost:8000/api/health

# Liveness (is the service running?)
curl http://localhost:8000/api/health/live

# Readiness (is the service ready for traffic?)
curl http://localhost:8000/api/health/ready
```

---

## Known Limitations & Roadmap

### Current Limitations

| Area | Limitation |
|------|------------|
| **Field Naming** | Dual naming convention (camelCase + snake_case) requires defensive coding |
| **TypeScript** | Some components still in JavaScript |
| **State Management** | Prop drilling - no global state (Context/Redux) |
| **Styling** | Inline styles only - no CSS framework |

### Future Improvements

- [ ] Complete TypeScript migration
- [ ] Add Redux Toolkit for state management
- [ ] Migrate to Tailwind CSS or styled-components
- [ ] Add WebSocket for real-time dashboard updates
- [ ] Implement offline mode with service workers
- [ ] Add multi-language support (i18n)
- [ ] PBS real-time inventory sync
- [ ] CRM integration (VinSolutions, DealerSocket)

---

## Performance

### Backend Optimizations

- Response caching for inventory queries
- Connection pooling for PostgreSQL
- Async/await throughout for non-blocking I/O
- Rate limiting to prevent abuse

### Frontend Optimizations

- React.memo for expensive components
- Lazy loading for route components
- Image optimization for vehicle photos
- Session storage for client-side state

### Recommended Specs

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Backend Server | 512MB RAM, 1 vCPU | 1GB RAM, 2 vCPU |
| Frontend Build | 1GB RAM | 2GB RAM |
| Database | 256MB RAM | 512MB RAM |

---

## Contributing

1. **Fork** the repository
2. **Create** a feature branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make** changes with appropriate tests
4. **Ensure** CI passes
   ```bash
   # Backend
   cd backend && pytest -v
   
   # Frontend
   cd frontend && npm test
   ```
5. **Submit** a pull request

### Code Style

- **Python**: Follow PEP 8, use type hints
- **TypeScript/JavaScript**: ESLint + Prettier
- **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Support

For issues or questions:
- **GitHub Issues**: [Create an issue](https://github.com/mpalmer79/quirk-ai-kiosk/issues)
- **Quirk IT Team**: Contact internal IT support

---

*Built with ❤️ for Quirk Auto Dealers - New England's #1 Dealer*

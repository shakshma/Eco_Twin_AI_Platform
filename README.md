# 🌿 EcoTwin AI — Carbon Footprint Intelligence Platform

> **Understand, Track, Predict & Reduce** your carbon footprint through AI-powered personalized insights.

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-2.0_Flash-orange.svg)](https://ai.google.dev)

---

## 🎯 What is EcoTwin AI?

EcoTwin AI is a full-stack carbon footprint awareness and reduction platform that combines **Machine Learning**, **Gemini AI**, and **real-world datasets** to help users:

- 📊 **Track** daily carbon emissions across Transport, Energy, Food & Waste
- 🤖 **Predict** footprint using a trained Random Forest ML model (R² > 0.95)
- 🎮 **Simulate** "what-if" lifestyle changes and see instant impact
- 🗺️ **AI Roadmap** — Gemini-powered 6-month personalized reduction plan
- 🌍 **Analyze** global emissions data by country and food systems
- 💡 **Recommend** actionable, data-driven eco-friendly habits

---

## 🏗️ Architecture

```
EcoTwin AI/
├── backend/           # FastAPI + ML Pipeline + Gemini AI
│   ├── app/
│   │   ├── api/       # REST endpoints (auth, footprint, analytics)
│   │   ├── ml/        # Random Forest model training & prediction
│   │   ├── models/    # SQLAlchemy ORM models
│   │   ├── schemas/   # Pydantic request/response schemas
│   │   ├── services/  # Calculator engine + Gemini AI service
│   │   └── core/      # Config & security
│   └── requirements.txt
├── frontend/          # React 19 + Vite + Tailwind + Recharts
│   └── src/
│       ├── components/  # Dashboard, Simulator, Roadmap, Analytics
│       └── context/     # Auth state management
├── data/              # 4 CSV datasets (80KB–2MB)
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- Gemini API Key ([Get one here](https://ai.google.dev))

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173** with the API at **http://localhost:8000**.

---

## 📊 Datasets

| Dataset | Records | Purpose |
|---|---|---|
| `personal_carbon_footprint_behavior.csv` | 1000+ | ML training — daily behavior → CO₂ prediction |
| `Agrofood_co2_emission.csv` | 6000+ | Country-level food system emissions (30+ factors) |
| `Carbon_(CO2)_Emissions_by_Country.csv` | 3000+ | Per-capita CO₂ by country & region |
| `vehicle_data_sample.csv` | 500+ | Vehicle CO₂ emissions by fuel type |

---

## 🤖 ML Pipeline

- **Model**: Random Forest Regressor (100 estimators)
- **Features**: 12 engineered features including `non_renewable_kwh`, `estimated_travel_emissions`, `eco_efficiency`
- **Preprocessing**: OneHotEncoder (categorical) + StandardScaler (numeric)
- **Explainability**: SHAP TreeExplainer for feature importance
- **Auto-training**: Model trains automatically on first startup if no `.pkl` exists

---

## 🗺️ AI Carbon Reduction Roadmap (Gemini-Powered)

The standout feature — a **6-month personalized reduction plan**:

```
Current: 14.12 kg/day → Month 6 Target: 5.93 kg/day (-58%)

Month 1: Transport Focus    → 12.43 kg  (carpool, transit, route optimization)
Month 2: Energy Focus       → 11.01 kg  (renewable tariff, LED, smart meters)
Month 3: Food & Diet Focus  → 9.32 kg   (plant-based swaps, meal prep, local sourcing)
Month 4: Waste Focus        → 7.91 kg   (composting, zero-waste kit, recycling)
Month 5: Community Focus    → 6.78 kg   (challenges, offsets, social accountability)
Month 6: Optimization Focus → 5.93 kg   (daily logging, automation, appliance upgrades)
```

Each month includes:
- 🎯 Target footprint & eco score
- 🧠 Gemini AI-generated personalized insight
- ✅ 3 specific, data-driven action items
- 📊 Category-level breakdown (Transport/Energy/Food/Waste savings)

---

## 🔑 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | Auto-generated | JWT signing key |
| `DATABASE_URL` | `sqlite:///./eco.db` | Database connection string |
| `GEMINI_API_KEY` | Required | Google Gemini API key |

---

## 📱 Features

| Feature | Description |
|---|---|
| **Carbon Dashboard** | Log daily activities, get ML prediction + eco score |
| **Reduction Simulator** | Compare current vs. simulated lifestyle changes |
| **AI Roadmap** | 6-month Gemini-powered step-down plan |
| **Recommendations** | Personalized tips based on latest behavior data |
| **Global Analytics** | Country emissions, food systems, vehicle comparisons |
| **Authentication** | JWT-based signup/login with profile management |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI, SQLAlchemy, Pydantic |
| **ML** | Scikit-learn, SHAP, Pandas, NumPy |
| **AI** | Google Gemini 2.0 Flash (REST API) |
| **Frontend** | React 19, Vite 8, Tailwind CSS, Recharts |
| **Auth** | JWT (PyJWT), bcrypt |
| **Database** | SQLite (dev) / PostgreSQL (prod) |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with 💚 for a sustainable future.
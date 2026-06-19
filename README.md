# LexGuard AI 🛡️

LexGuard AI is an enterprise-grade contract intelligence and risk audit platform. It utilizes a Multi-Agent AI workflow powered by Gemini 2.5 Pro to parse contracts (PDF, DOCX, TXT), classify agreements, identify risky clauses, audit compliance framework alignments (GDPR, CCPA, etc.), detect missing clauses, and offer a RAG-based legal negotiation chatbot.

## Core Features
1. **Multi-Agent Analysis Pipeline**: Automates contract classification, clause parsing, risk scoring, compliance auditing, and recommendation compiling.
2. **Interactive Heatmap**: Evaluates risk severities across six domains: Liability, Financial, IP, Compliance, Data Privacy, and Operational.
3. **Missing Clause Detector**: Compares your documents against standard templates to identify critical omissions.
4. **AI Negotiator Chat**: Clickable floating Q&A chat sidebar utilizing semantic context indexing.
5. **Contract Comparison Workspace**: Compare two agreements side-by-side with risk differences and similarity matches.
6. **PDF Audit Exporter**: Generates structured, professional PDF audit summaries.

---

## Directory Architecture
```
lexguard-ai/
├── backend/
│   ├── app/
│   │   ├── api/          # Routers (auth, contracts, chat)
│   │   ├── core/         # Config, Database base session, JWT Security rules
│   │   ├── models/       # SQLAlchemy models (multi-tenant mapping)
│   │   ├── schemas/      # Pydantic schemas (validations)
│   │   ├── services/     # Multi-Agent engine, FAISS/TF-IDF store, ReportLab PDF exporter
│   │   └── main.py       # FastAPI app bootstrap
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/   # Shared layouts, Q&A sidebars, nav panels
│   │   ├── pages/        # Dashboard, Compare workspace, Documents repository
│   │   ├── store/        # Zustand stores (contracts & auth data states)
│   │   ├── App.tsx       # SPA Routing
│   │   ├── index.css     # Dark mode style rules & glassmorphism custom classes
│   │   └── main.tsx
│   └── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── seed_data.py          # Seeder script
```

---

## Quickstart Guide (Local Running)

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

### 1. Database & Seeding
First, navigate to the project directory and run the database seeder to create sample users and pre-analyzed contracts:
```bash
# Install python packages
pip install -r backend/requirements.txt

# Run seeder
python seed_data.py
```
This initializes the database (`backend/lexguard.db` using SQLite fallback) and registers:
- **Admin**: `admin@lexguard.ai` / `password123`
- **Analyst**: `analyst@lexguard.ai` / `password123`
- **User**: `user@lexguard.ai` / `password123`

### 2. Run Backend API
Start the FastAPI server:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
API Documentation is available locally at: `http://localhost:8000/docs`.

### 3. Run Frontend App
Install dependencies and spin up the development client:
```bash
cd frontend
npm install
npm run dev
```
Navigate to the displayed Vite URL (e.g. `http://localhost:5173`) and sign in using the seed credentials.

---

## Docker Deployment (PostgreSQL + MinIO)
To deploy the entire production stack (FastAPI backend, React static distribution served via Nginx, PostgreSQL db, and MinIO storage services):
```bash
docker-compose up --build
```
- **Frontend Panel**: `http://localhost:8080`
- **Backend API Docs**: `http://localhost:8000/docs`
- **MinIO Dashboard**: `http://localhost:9001` (user: `minioadmin` / password: `minioadminpassword2026`)

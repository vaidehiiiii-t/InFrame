# EventSnap — Event Photo Sharing Platform

EventSnap is a web platform where hosts create events with an automatic retention period and receive a unique PIN. Guests join via PIN and (in upcoming milestones) upload and receive photos using facial recognition.

## Milestone 1 (M1) Overview

- **Authentication (F1)**: Secure signup and login with hashed passwords (bcrypt) and JWT session tokens.
- **Event Creation (F3)**: Authenticated hosts create events with name, date, and retention period (1–180 days). System generates a unique, collision-resistant 8-character PIN and prepares an AWS Rekognition collection ID.
- **PIN-Based Join Flow (F4)**: Guests enter the 8-character PIN to join events. Features rate limiting (max 5 attempts/hour) to protect against brute force.
- **Modern React Frontend**: Clean, responsive, glassmorphic UI built with Vite + React + TailwindCSS.
- **Database & Migrations**: PostgreSQL data models (`users`, `events`, `event_members`) managed with SQLAlchemy 2.0 and Alembic.

---

## Tech Stack (M1)

- **Backend**: FastAPI (Python 3.11, async)
- **ORM / Migrations**: SQLAlchemy 2.0 (asyncpg) + Alembic
- **Database**: PostgreSQL 16
- **Auth**: JWT (jose) + Passlib (bcrypt)
- **Frontend**: React 18 + Vite + TailwindCSS + Lucide Icons
- **Containerization**: Docker Compose

---

## Project Structure

```
event_snap/
├── docker-compose.yml       # Orchestrates PostgreSQL, FastAPI Backend, and React Frontend
├── .env.example             # Environment variable template
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/             # Database migrations
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   ├── app/
│   │   ├── main.py          # FastAPI application entrypoint
│   │   ├── core/            # Config, database engine, security, rate limiting
│   │   ├── models/          # User, Event, EventMember SQLAlchemy models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── api/v1/          # /auth, /events endpoints
│   │   └── utils/           # PIN generator
│   └── tests/               # Pytest async integration tests
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── context/         # AuthContext with token persistence
        ├── api/             # Axios API client
        ├── components/      # Navbar, Modal, ProtectedRoute
        └── pages/           # Login, Signup, Dashboard, EventDetail
```

---

## Quick Start with Docker Compose

To run the complete stack (PostgreSQL + FastAPI Backend + React Frontend):

```bash
docker compose up --build
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## Standalone Local Development

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations (ensure local Postgres is running or update DATABASE_URL in .env)
alembic upgrade head

# Start API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Run Backend Tests

```bash
cd backend
pytest -v
```

---

## Roadmap

- [x] **M1**: Auth + Event Creation + PIN Join Flow
- [ ] **M2**: Photo Upload + Gallery View
- [ ] **M3**: Face Indexing + Matching Pipeline (AWS Rekognition)
- [ ] **M4**: Retention System + Scheduled Purge + Data Deletion Flow
- [ ] **M5**: Real-Time Gallery Updates (WebSocket) + Match Confirmation UI
- [ ] **M6**: Cloud Deployment (ECS Fargate + CloudFront + S3)

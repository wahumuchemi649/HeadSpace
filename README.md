# HeadSpace 🧠

An AI-powered mental health platform that connects patients, therapists, and organizations in one unified system. HeadSpace makes therapy accessible through smart booking, real-time chat, and automatic AI-driven progress tracking after every session.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [AI Progress Tracking](#ai-progress-tracking)
- [User Roles](#user-roles)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)

---

## Overview

HeadSpace solves three problems in mental healthcare:

- **Access** — patients book verified therapists by specialty, availability and budget. Organization members (universities, companies) get subsidized or free sessions covered by their institution.
- **Continuity** — a fine-tuned AI model analyzes every completed therapy session and generates mood, anxiety and engagement scores that appear as a progress curve on the patient's dashboard.
- **Fairness** — independent therapists are surfaced on equal footing with organizational providers. Pricing is transparent and set by the therapist.

---

## Features

**Patient**
- Browse and book therapists by specialty and availability
- Real-time therapy chat with session notes
- AI progress dashboard showing mood, anxiety and engagement trends across sessions
- Community groups for peer support

**Therapist**
- Manage availability schedule
- Conduct sessions via WebSocket-powered chat
- Take and save session notes
- Set custom session rates (45 min / 60 min)

**Organization (University / Company)**
- Onboard and attach therapists to the organization
- Provide subsidized or free sessions to members
- Monitor aggregate wellness trends without accessing private content

**Admin**
- Super admin panel for platform-wide management
- Org admin panel for organization-level management
- Platform analytics dashboard

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 5, Django REST Framework |
| Real-time | Django Channels, WebSockets |
| Frontend | React, Recharts |
| Auth | JWT (SimpleJWT) |
| Database | PostgreSQL (Supabase) / SQLite (dev) |
| AI Model | DistilBERT (fine-tuned), HuggingFace Transformers |
| Deployment | Render (backend), Render Static (frontend) |
| Email | SMTP (booking confirmations) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    React Frontend                    │
│   Booking · Chat · Progress Dashboard · Community   │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP / WebSocket
┌───────────────────────▼─────────────────────────────┐
│                  Django Backend                      │
│                                                      │
│  ┌─────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ consultation│  │  chat    │  │    patients    │  │
│  │  (Sessions) │  │(Messages)│  │    therapy     │  │
│  └─────────────┘  └──────────┘  └────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │              ml/ (AI Module)                  │   │
│  │  predictor.py → service.py → signals.py       │   │
│  └──────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────┘
                        │
        ┌───────────────▼──────────────┐
        │     PostgreSQL (Supabase)    │
        └──────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL or SQLite for local development

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/your-username/headspace.git
cd headspace/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run the development server
python manage.py runserver
```

### Frontend Setup

```bash
cd headspace/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### AI Model Setup

The AI model files are not included in the repository due to size (~418MB). To set up:

1. Download the trained model from [Google Drive link] or retrain using the notebook in `ml/training/`
2. Place the extracted `final/` folder inside `backend/ml/`:

```
backend/ml/
└── final/
    ├── config.json
    ├── model.safetensors
    ├── tokenizer.json
    ├── tokenizer_config.json
    └── label_mapping.json
```

To retrain the model from scratch, open `ml/training/train_model.ipynb` in Google Colab, switch to a T4 GPU runtime, and run all cells.

---

## Environment Variables

Create a `.env` file in the backend root:

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
DATABASE_URL=your-database-url

# JWT
JWT_SECRET_KEY=your-jwt-secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# CORS
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

## AI Progress Tracking

After every therapy session is marked as completed, a Django signal automatically triggers the AI analysis pipeline:

```
Session completed
      ↓
post_save signal fires (chat/signals.py)
      ↓
Background thread runs run_session_analysis()
      ↓
DistilBERT model scores all patient messages
      ↓
Three scores saved to PatientProgress table
      ↓
Patient dashboard graph updates on next visit
```

**Model details:**
- Base model: `distilbert-base-uncased`
- Training data: 53,000+ mental health conversations (Kaggle)
- Accuracy: 89% on held-out test set
- Labels: `high` / `medium` / `low` severity
- Output scores: Mood (0–100%), Anxiety (0–100%), Engagement (0–100%)

---

## User Roles

| Role | Access |
|---|---|
| Patient | Book sessions, chat, view own progress, join communities |
| Therapist | Manage availability, conduct sessions, take notes |
| Org Admin | Manage organization therapists and members |
| Super Admin | Platform-wide analytics and management |

---

## API Endpoints

### Auth
```
POST   /api/login/
POST   /api/register/
POST   /api/token/refresh/
```

### Sessions
```
POST   /session/                          Book a session
GET    /upcoming-sessions/                Get upcoming sessions
GET    /chat/my_sessions/                 Get all sessions
GET    /chat/<session_id>/check-access/   Check session access
```

### Chat
```
GET    /chat/<session_id>/messages/       Get messages
POST   /chat/<session_id>/send/           Send a message
GET    /chat/<session_id>/notes/          Get session notes
POST   /chat/<session_id>/notes/save/     Save session notes
```

### Progress
```
GET    /chat/progress/                    Get patient progress scores
```

### Therapists
```
GET    /therapists/                       List all therapists
GET    /therapist/<id>/availability/      Get therapist availability
GET    /api/available-therapists/         Get therapists for logged-in patient
```

---

## Deployment

The backend is deployed on **Render** with **Supabase PostgreSQL**.

**Build command:**
```bash
pip install -r requirements.txt && python manage.py migrate
```

**Start command:**
```bash
daphne Backend.asgi:application --port $PORT --bind 0.0.0.0
```

> **Note:** The ML model files must be available on the server for AI analysis to run. If model files are missing, the system degrades gracefully — booking and chat continue to work normally, only AI scoring is disabled.

---

## License

MIT License — see `LICENSE` for details.

---

*Built by Wahu Muchemi — Software Engineering, Kenya*

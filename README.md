# Loan Follow-Up Management System

A world-class, mobile-first, responsive web application for managing loan follow-ups, field visits, reminders, and delinquency tracking. Built as a Progressive Web App (PWA) with full offline support for field staff.

## Overview

This system is designed for financial institutions (MFIs, cooperatives, NBFCs) to streamline their loan collection and follow-up processes. It replaces manual Excel-based tracking with an interactive, real-time platform.

**Key Capabilities:**
- Import loan portfolios from Excel/CSV
- Track follow-up stages with an automated workflow engine
- Schedule and log field visits with GPS and photo capture (offline-capable)
- Automated reminder system with in-app notifications
- Interactive dashboard with portfolio health analytics
- Mobile-optimized for field staff use

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, Headless UI, Radix UI |
| **Charts** | Recharts |
| **Maps** | Leaflet (free, offline-compatible) |
| **PWA** | Workbox, IndexedDB |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL (via Supabase/Neon) |
| **ORM** | Prisma |
| **API** | REST + WebSocket |
| **Auth** | JWT |
| **Hosting** | Vercel (frontend) + Railway/Render (backend) |

## Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd loan-followup-app

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start development servers
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

## Project Structure

```
loan-followup-app/
├── docs/                           # Documentation
│   ├── ARCHITECTURE.md             # System architecture
│   ├── SCHEMA.md                   # Database schema
│   ├── API.md                      # API reference
│   ├── WORKFLOW.md                 # Follow-up stages workflow
│   ├── FEATURES.md                 # Feature documentation
│   ├── DEVELOPMENT.md              # Development setup guide
│   ├── DEPLOYMENT.md               # Deployment guide
│   ├── CONTRIBUTING.md             # Contribution guidelines
│   └── ROADMAP.md                  # Future plans
├── frontend/                       # React PWA frontend
│   ├── public/                     # Static assets
│   └── src/                        # Source code
│       ├── components/             # Reusable UI components
│       ├── pages/                  # Route pages
│       ├── hooks/                  # Custom React hooks
│       ├── services/               # API service layer
│       ├── utils/                  # Utility functions
│       ├── types/                  # TypeScript type definitions
│       └── context/                # React context providers
├── backend/                        # Node.js Express API
│   ├── src/
│   │   ├── routes/                 # API route definitions
│   │   ├── controllers/            # Request handlers
│   │   ├── services/               # Business logic
│   │   ├── models/                 # Data models
│   │   ├── middleware/             # Express middleware
│   │   ├── utils/                  # Utility functions
│   │   └── types/                  # TypeScript definitions
│   └── prisma/                     # Prisma schema + migrations
├── shared/                         # Shared types/constants
├── package.json
└── CHANGELOG.md
```

## Documentation

Each aspect of the system is documented in the `docs/` directory:

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, data flow, component design |
| [SCHEMA.md](docs/SCHEMA.md) | Full database schema with all tables and relationships |
| [API.md](docs/API.md) | Complete API endpoint reference |
| [WORKFLOW.md](docs/WORKFLOW.md) | Follow-up stage definitions and transitions |
| [FEATURES.md](docs/FEATURES.md) | Detailed feature descriptions |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Setup guide for local development |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Cloud deployment instructions |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | How to contribute to the project |
| [ROADMAP.md](docs/ROADMAP.md) | Planned features and improvements |

## License

[License Type] — see LICENSE file.

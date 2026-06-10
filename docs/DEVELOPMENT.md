# Development Setup

## Prerequisites

- Node.js 20+ (LTS)
- npm 10+
- PostgreSQL 15+
- Git

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repo-url>
cd loan-followup-app
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL="postgresql://user:password@localhost:5432/loan_followup"
# JWT_SECRET="your-secret-key"

# Run database migrations
npx prisma migrate dev

# Seed demo data (optional)
npx prisma db seed

# Start development server
npm run dev
```

Backend runs on `http://localhost:4000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env
# VITE_API_URL="http://localhost:4000/api/v1"

# Start development server
npm run dev
```

Frontend runs on `http://localhost:5173`

### 4. Verify Setup

- Open `http://localhost:5173` in browser
- Login with default credentials (if seeded):
  - Username: `admin`
  - Password: `admin123`
- You should see the dashboard with sample data

---

## Project Scripts

### Backend

| Script | Command | Description |
|--------|---------|-------------|
| dev | `npm run dev` | Start with hot-reload (ts-node-dev) |
| build | `npm run build` | Compile TypeScript to dist/ |
| start | `npm start` | Run compiled JS in production |
| test | `npm test` | Run tests |
| lint | `npm run lint` | Lint and format check |
| migrate | `npx prisma migrate dev` | Run database migrations |
| seed | `npx prisma db seed` | Seed demo data |
| studio | `npx prisma studio` | Open Prisma DB browser |

### Frontend

| Script | Command | Description |
|--------|---------|-------------|
| dev | `npm run dev` | Vite dev server with HMR |
| build | `npm run build` | Production build to dist/ |
| preview | `npm run preview` | Preview production build |
| test | `npm test` | Run tests (Vitest) |
| lint | `npm run lint` | ESLint check |
| format | `npm run format` | Prettier formatting |

---

## Environment Variables

### Backend (.env)

```
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/loan_followup"

# JWT
JWT_SECRET="your-secret-key-minimum-32-chars"
JWT_EXPIRES_IN="24h"

# CORS
CORS_ORIGIN="http://localhost:5173"

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760

# Photo Storage
STORAGE_PROVIDER="local"  # local | cloudinary | s3
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

### Frontend (.env)

```
VITE_API_URL="http://localhost:4000/api/v1"
VITE_WS_URL="ws://localhost:4000"
VITE_MAP_TILE_URL="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
VITE_APP_NAME="Loan Follow-up System"
```

---

## Code Conventions

### TypeScript
- Strict mode enabled
- Explicit return types on functions
- Interfaces over types (for objects)
- PascalCase for components and types
- camelCase for functions and variables

### React
- Functional components with hooks only (no classes)
- Custom hooks for reusable logic
- Context + useReducer for global state (avoid Redux)
- Props interfaces defined in component file or types/
- Co-located styles (Tailwind utility classes)

### Backend
- Layered architecture: routes → controllers → services
- Services contain all business logic
- Controllers only handle request/response
- Zod schemas for validation (shared between frontend and backend)
- Error handling via custom AppError class

### Git Commit Messages

```
feat: add field visit photo capture
fix: resolve offline sync conflict
docs: update API endpoint documentation
refactor: extract stage validation logic
style: format with prettier
test: add field visit service tests
chore: update dependencies
```

---

## Testing

### Backend Tests
```bash
cd backend
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage # With coverage report
```

### Frontend Tests
```bash
cd frontend
npm test              # Run all tests (Vitest)
npm test -- --ui      # Vitest UI mode
```

### Test Structure
```
backend/src/
  __tests__/
    services/
      loan.test.ts
      followup.test.ts
      visit.test.ts
    routes/
      auth.test.ts
      loans.test.ts

frontend/src/
  __tests__/
    components/
      LoanCard.test.tsx
      Dashboard.test.tsx
    hooks/
      useOfflineSync.test.ts
    pages/
      LoanList.test.tsx
```

---

## Database Management

### Create a Migration
```bash
cd backend
npx prisma migrate dev --name add_visit_photos
```

### Reset Database
```bash
npx prisma migrate reset
```

### View Data
```bash
npx prisma studio
# Opens browser at http://localhost:5555
```

---

## Debugging

### Backend
- Use `console.log` or `debug` package
- VS Code launch config for breakpoints
- `NODE_ENV=development` enables detailed error messages

### Frontend
- React DevTools for component inspection
- Redux DevTools (if using) for state inspection
- Chrome Lighthouse for PWA audits
- Network tab for API debugging

### Offline Testing
- Chrome DevTools → Application → Service Workers → "Offline" checkbox
- Network tab → "Offline" preset
- Check IndexedDB in Application tab
- Background Sync in Application tab

---

## Build for Production

### Backend
```bash
cd backend
npm run build                  # Compiles to dist/
npm run migrate:prod           # Run production migrations
npm start                      # Start production server
```

### Frontend
```bash
cd frontend
npm run build                  # Builds to dist/
# Deploy dist/ contents to your hosting (Vercel, Netlify, etc.)
```

### Docker (Alternative)
```bash
# Build images
docker-compose build

# Run all services
docker-compose up -d

# Stop
docker-compose down
```

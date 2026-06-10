# Deployment Guide

## Overview

The system is designed for **cloud deployment** with separate frontend and backend services. This guide covers production deployment.

---

## Architecture (Production)

```
┌─────────────────────────────────────────────────┐
│                    Vercel                         │
│  ┌───────────────────────────────────────────┐   │
│  │     React PWA (Static Build)              │   │
│  │     Custom Domain: app.yourorg.com        │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────┘
                      │
                      HTTPS
                      │
┌─────────────────────┴───────────────────────────┐
│                  Railway / Render                 │
│  ┌───────────────────────────────────────────┐   │
│  │   Node.js Express API Server              │   │
│  │   Custom Domain: api.yourorg.com          │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────┘
                      │
                      │
┌─────────────────────┴───────────────────────────┐
│                  Neon / Supabase                  │
│  ┌───────────────────────────────────────────┐   │
│  │   PostgreSQL Database                     │   │
│  │   Automatic backups, point-in-time        │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## Option 1: Vercel (Frontend) + Railway (Backend)

### Frontend → Vercel

1. Push code to GitHub/GitLab
2. Connect repo to Vercel
3. Configure:
   - **Framework**: Vite
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
   - **Environment variables**:
     ```
     VITE_API_URL=https://api.yourorg.com/api/v1
     VITE_WS_URL=wss://api.yourorg.com
     VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
     ```

### Backend → Railway

1. Connect backend repo to Railway
2. Configure:
   - **Root directory**: `backend`
   - **Start command**: `npm run start`
   - **Environment variables**:
     ```
     NODE_ENV=production
     DATABASE_URL=postgresql://...
     JWT_SECRET=<strong-random-secret>
     JWT_EXPIRES_IN=24h
     CORS_ORIGIN=https://app.yourorg.com
     STORAGE_PROVIDER=cloudinary
     CLOUDINARY_CLOUD_NAME=...
     CLOUDINARY_API_KEY=...
     CLOUDINARY_API_SECRET=...
     RATE_LIMIT_WINDOW_MS=60000
     RATE_LIMIT_MAX=100
     ```
3. Add PostgreSQL plugin → Railway auto-provisions DB
4. Run migrations: `npx prisma migrate deploy`

---

## Option 2: Docker + Any Cloud

### Docker Compose (Production)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: loan_followup
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 10s

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://app:${DB_PASSWORD}@postgres:5432/loan_followup
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${FRONTEND_URL}
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "4000:4000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      VITE_API_URL: ${API_URL}
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Dockerfiles

**backend/Dockerfile:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

**frontend/Dockerfile:**
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Database Setup

### Neon (Serverless PostgreSQL)
1. Sign up at neon.tech
2. Create a project → get connection string
3. Set as `DATABASE_URL` in backend env
4. Run migrations: `npx prisma migrate deploy`

### Supabase
1. Sign up at supabase.com
2. Create a project
3. Copy connection string (transaction mode, not pooled)
4. Run migrations

**Production migration command:**
```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

---

## File Storage

### Option A: Local (Development only)
- Files stored in `./uploads` directory
- Not suitable for production (lost on redeploy)

### Option B: Cloudinary (Recommended)
- Sign up at cloudinary.com
- Get cloud name, API key, API secret
- Photos uploaded directly from frontend to Cloudinary (unsigned upload)
- Backend stores the returned URL

### Option C: AWS S3
- Create S3 bucket with public-read policy
- Generate access key + secret
- Use `multer-s3` for direct uploads

---

## Environment-Specific Configuration

### Development
```env
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://local:local@localhost:5432/loan_followup_dev
```

### Staging
```env
NODE_ENV=staging
CORS_ORIGIN=https://staging-app.yourorg.com
DATABASE_URL=postgresql://... (staging DB)
```

### Production
```env
NODE_ENV=production
CORS_ORIGIN=https://app.yourorg.com
DATABASE_URL=postgresql://... (production DB, with SSL)
```

---

## Monitoring & Maintenance

### Health Check Endpoint
```
GET /api/v1/health
→ { status: "ok", timestamp: "...", uptime: 12345, db: "connected" }
```

### Logging
- Backend: Structured JSON logs via `pino`
- Collect with: Papertrail, Logtail, or stdout (Railway/Render)
- Frontend: Console logging (dev only)

### Backup Strategy
- Database: Daily automated backups (Neon/Supabase built-in)
- Files: Cloudinary/S3 manages redundancy
- Export: Monthly full data export via report API

### Monitoring (Recommended)
- **Uptime**: Better Uptime or Pingdom
- **Errors**: Sentry (frontend + backend)
- **Performance**: Vercel Analytics (frontend), PM2 (backend)
- **Usage**: Custom dashboard analytics

---

## Scaling

### When to Scale
| Metric | Threshold | Action |
|--------|-----------|--------|
| Active users | > 50 concurrent | Add API server instance |
| API response > 500ms | > 10% of requests | Add read replica DB |
| DB size | > 10GB | Archive old data |
| Storage | > 50GB | Enable CDN for photos |

### Horizontal Scaling
```bash
# Railway: Increase replicas in dashboard
railway scale backend=3

# Docker Swarm / K8s
docker service scale backend=3
```

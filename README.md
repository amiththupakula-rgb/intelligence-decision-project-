# IntelliDecision AI
## An Explainable AI-Powered Decision Intelligence System

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud%20PostgreSQL%20%2B%20Auth-3ECF8E.svg)](https://supabase.com)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-%40google%2Fgenai-4285F4.svg)](https://ai.google.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3-38B2AC.svg)](https://tailwindcss.com)

---

## 1. Executive Product Overview

**IntelliDecision AI** is an enterprise-grade Decision Intelligence platform that bridges the gap between raw, fragmented data and strategic, defensible decision-making.

Unlike standard analytics dashboards or unrestricted conversational AI wrappers, IntelliDecision AI strictly adheres to the core engineering principle:

> **The language model explains the results; it must never fabricate the underlying numbers.**

Every recommendation is grounded in deterministic statistical calculations, multi-criteria decision analysis (MCDA), quantitative risk matrices, and traceable evidence identifiers (`EVID-STAT-xxx`, `EVID-CORR-xxx`, `EVID-EVAL-xxx`, `EVID-RISK-xxx`). Consequential decisions require explicit human authorization, establishing complete audit accountability.

---

## 2. The 8-Stage Intelligence Pipeline

The platform operationalizes an end-to-end decision intelligence workflow answering five core strategic questions:

```text
[ Data Ingestion ] ──────> [ Data Cleaning ] ──────> [ Pattern Discovery ]
 (CSV, XLSX, JSON)       (Quality Scoring 0-100)    (Stats, Trends, Pearson r)
                                                                 │
                                                                 ▼
[ Continuous Monitoring ] <── [ Final Human Decision ] <── [ Explainable AI ] <── [ MCDA Evaluation ] & [ Risk Matrix ]
 (KPI Deviation Alerts)      (Locked Audit Record)     (Google Gemini SDK)     (Weighted Sum Model)  (5x5 L x I Grid)
```

1. **What is happening based on available data?** Automated dataset ingestion, type inference, completeness, uniqueness, and consistency quality scoring.
2. **What important patterns, relationships, and trends exist?** Deterministic calculations for mean, median, standard deviation, IQR outlier detection, linear regression slope/R², and Pearson correlation.
3. **What possible decisions or alternatives are available?** Domain-templated and custom multi-alternative modeling.
4. **What are the expected benefits, risks, and trade-offs?** Multi-criteria decision analysis (WSM on normalized 0–100 scale) with ±20% weight sensitivity analysis and a 1–25 predictive risk matrix.
5. **Which alternative should be considered, and why?** Evidence-backed Gemini AI synthesis citing specific calculation IDs, assumptions, and uncertainties.

---

## 3. Technology Stack

### Frontend (`/client`)
- **Framework:** React 18 with functional components and hooks.
- **Styling:** Tailwind CSS with light and dark mode support.
- **Routing:** React Router v7.
- **State & Data Fetching:** TanStack Query + Context API (`AuthContext`, `ThemeContext`).
- **Data Visualizations:** Recharts (Bar charts, line charts, sensitivity displays).
- **Icons:** Lucide React.
- **Data Parsers:** PapaParse (CSV) and SheetJS (`xlsx`).
- **Validation:** Zod schemas.

### Backend (`/server`)
- **Runtime:** Node.js LTS (ES Modules).
- **Framework:** Express.js REST API (`/api/v1`).
- **AI Engine:** Official `@google/genai` SDK (`gemini-2.5-flash`).
- **Database & Auth:** Supabase Cloud PostgreSQL, Supabase Auth client, and direct `pg` pool.
- **Security:** Helmet, CORS allowlisting, Express Rate Limiter, Zod payload validators.
- **File Processing:** Multer memory storage with file type and size constraints.
- **Logging:** Structured logging via `pino` and `pino-pretty`.

---

## 4. Database Schema & Migration Runner

The complete database schema is maintained in `/supabase/migrations/001_initial_schema.sql` and includes:
- **18 Relational Tables:** `profiles`, `decision_projects`, `datasets`, `dataset_records`, `data_analyses`, `alternatives`, `evaluation_criteria`, `alternative_scores`, `evaluation_results`, `risk_assessments`, `ai_recommendations`, `final_decisions`, `monitoring_metrics`, `monitoring_history`, `monitoring_alerts`, `activity_logs`, `notifications`, `application_settings`.
- **Row Level Security (RLS):** Strict multi-tenant data isolation enforcing `auth.uid() = user_id` across all user-owned tables and cascading parent ownership policies.
- **Triggers & Functions:** Automated `updated_at` timestamps and user profile auto-creation trigger on `auth.users`.
- **Idempotent Seed Data:** Decision domains (Business, Healthcare Administration, Education, Agriculture, Supply Chain, Personal Finance, General), risk classification thresholds, and MCDA formulas.

### Migration Commands

The migration runner is located at `/scripts/migrate.js`:

```bash
# Check migration status without applying
npm run db:migrate:status

# Apply pending migrations to Supabase Cloud PostgreSQL
npm run db:migrate
```

The runner:
1. Verifies database credentials from `.env`.
2. Acquires a distributed lock in `schema_migration_locks`.
3. Verifies version history in `schema_migrations`.
4. Executes pending migrations inside an atomic transaction.
5. Records SHA-256 checksums and releases the lock.

---

## 5. Environment Variables Configuration

Copy `.env.example` to `.env` in the root and `/server`:

```env
# Application
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
API_BASE_URL=http://localhost:5000/api/v1

# Supabase Public Configuration (Frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Supabase Cloud PostgreSQL (Direct Connection for Migrations)
SUPABASE_DB_HOST=db.your-project.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-db-password
SUPABASE_DB_SSL=true

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

*Note:* When running in local development before entering external credentials, the platform automatically activates an interactive development sandbox mode so all deterministic calculation engines, MCDA models, risk matrices, and UI workflows remain fully testable.

---

## 6. Installation & Running Locally

### Step 1: Install Dependencies
```bash
# Root dependencies
npm install

# Backend dependencies
cd server && npm install && cd ..

# Frontend dependencies
cd client && npm install && cd ..
```

### Step 2: Run Database Migrations
```bash
npm run db:migrate
```

### Step 3: Start the Backend Server
```bash
npm run server
# Server starts on http://localhost:5000
# API Base: http://localhost:5000/api/v1
# Health Check: http://localhost:5000/health
```

### Step 4: Start the Frontend Client
In a separate terminal:
```bash
npm run client
# Client dev server starts on http://localhost:5173
```

---

## 7. Running Tests

The application features comprehensive automated unit and integration test suites:

```bash
# Run deterministic calculation engine unit tests
node --test tests/unit/engines.test.js

# Run full end-to-end API lifecycle integration tests
node --test tests/integration/api.test.js
```

### Verified Test Coverage
- **Descriptive Statistics:** Mean, median, mode, variance, standard deviation, IQR bounds, skewness.
- **Correlation & Trend Analysis:** Pearson $r$ coefficient and linear regression slope.
- **MCDA Scoring Engine:** Benefit vs. Cost normalization, zero-range handling, ranking, and sensitivity analysis.
- **Risk Assessment:** Likelihood × Impact deterministic scoring, 5x5 matrix mapping.
- **Continuous Monitoring:** Actual vs. expected KPI deviations and automatic threshold breach alerting.
- **Comprehensive Reporting:** Audit trail generation and CSV exports.

---

## 8. License

MIT License. Built by the IntelliDecision AI Team.

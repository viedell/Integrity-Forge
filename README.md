# IntegrityForge 🛡️

IntegrityForge is an advanced, deterministic academic integrity analysis and literature review platform. It helps researchers, students, and academic institutions evaluate the quality of research evidence, build concept-driven claim networks, track chronological study evolution, and identify genuine scientific gaps without the hallucination risks associated with AI/LLM models.

---

## 🏗️ Architecture & Project Structure

The project is structured as a **pnpm monorepo** containing frontend applications, API services, and shared utility packages.

```
Integrity-Forge/
├── artifacts/
│   ├── api-server/         # Express API Server (Node.js)
│   │   └── src/lib/
│   │       ├── gap/        # Student Gap Generator pipeline logic
│   │       └── insight/    # Academic Insight Analyzer (Reliability, Claim Network, Timeline)
│   ├── integrity-forge/    # Vite + React (TypeScript) frontend dashboard
│   └── mockup-sandbox/     # Prototyping sandbox
├── lib/
│   ├── api-client-react/   # Generated React Query hooks & API schemas
│   ├── api-spec/           # OpenAPI Specification (openapi.yaml)
│   ├── api-zod/            # Zod validation schemas compiled from OpenAPI spec
│   └── db/                 # Database schema definitions and Drizzle migration scripts
├── pnpm-workspace.yaml     # Monorepo configuration
└── package.json            # Workspace root package definition
```

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Radix UI (shadcn/ui), TanStack Query (React Query), Lucide React (icons).
- **Backend**: Express, Node.js (with ESM configuration), TypeScript, Pino (structured logging).
- **Database & ORM**: PostgreSQL, Drizzle ORM, Drizzle Kit.
- **API Spec & Codegen**: OpenAPI v3 spec, Orval (react-query hooks and client generation), Zod (runtime validation schemas).
- **Package Manager**: pnpm.

---

## 🚀 Key Features

### 1. Evidence Reliability Analyzer
Deterministically evaluates the grounding quality of paper claims based on 6 core signals extracted directly from sentences:
- Dataset / Sample representation
- Methodology explicitness
- Statistical evaluation (e.g., $p$-values, confidence intervals)
- Limitations discussion
- Future work/recommendations
- Quantitative evaluation metrics

It assigns a reliability score (0-100) and flags structural gaps (e.g., lack of dataset or statistics).

### 2. Claim Relationship Engine & Graph
Builds scientific claim networks based on taxonomic similarity and research intent:
- **Condition A (Taxonomy Match)**: Looks up concepts against a 10+ domain scientific catalog.
- **Condition B (Intent Convergence)**: Matches research intent overlap (propose, evaluate, extend, contradict).
- Assigns deterministic edge labels (`supports`, `extends`, `contradicts`, `improves`, `summarizes`) with confidence scores and trace evidence.

### 3. Chronological Evolution Timeline
Groups research methodologies, concepts, and dominant findings chronologically to visualize the historical trajectory of a scientific domain.

### 4. Corpus-level Concept Cloud
Uses taxonomy catalog weights combined with cross-paper term frequency to extract, score, and rank dominant scientific concepts across the entire uploaded corpus.

---

## 💻 Getting Started

### 📋 Prerequisites
- Node.js (v22.x or higher recommended)
- pnpm (`npm i -g pnpm`)
- PostgreSQL instance running locally or hosted

### ⚙️ Environment Configuration
Create a `.env` file in the root directory (based on `.env.example` if available):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/integrity_forge
CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
CLERK_SECRET_KEY=your_clerk_secret_key
PORT=8080
```

### 📦 Installation
Install dependencies across the entire workspace:
```bash
pnpm install
```

### 🗄️ Database Setup & Migrations
Push the database schema directly to PostgreSQL using Drizzle Kit:
```bash
pnpm --filter @workspace/db run push
```

### ⚡ Running the Applications
Run development servers for both the backend and frontend concurrently:
```bash
# Start backend server
pnpm --filter @workspace/api-server run dev

# Start Vite frontend dev server
pnpm --filter @workspace/integrity-forge run dev
```

---

## 🧪 Testing & Verification

### Unit Tests
Verify the deterministic pipeline engines using Node's native test runner:
```bash
# Run unit tests on api-server
pnpm --filter @workspace/api-server run test
```

### Type Checking
Ensure type safety across all frontend and backend packages:
```bash
pnpm run typecheck
```

---

## 🛠️ API Development & Rebuilding SDK Client

If you modify `lib/api-spec/openapi.yaml`, run the following commands to regenerate the react-query client hooks and API types:

```bash
# Generate updated Zod schemas & client libraries
pnpm --filter @workspace/api-zod run generate

# Rebuild declarations for react hooks package
npx tsc -p lib/api-client-react/tsconfig.json
```

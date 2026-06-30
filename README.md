# IntegrityForge 🛡️

IntegrityForge is an advanced, deterministic academic integrity analysis and literature review platform. It is designed to help researchers, students, and academic institutions evaluate the quality of research evidence, discover research gaps, identify collusion or copycat submissions, and map knowledge domains without the risk of AI hallucination.

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

## 🚀 Key Features in Detail

IntegrityForge is split into two primary interfaces: the **Instructor Console** and the **Student & Research Portal**.

### 🧑‍🏫 1. Instructor & Course Management Console
Designed for course directors to monitor submissions, customize academic constraints, and review anomalies.
- **Assignment Control Panel**: Instructors can create, configure, view metrics for, and permanently delete assignments. Deletion cascade-removes all student submissions and similarity scores cleanly.
- **Visual Collusion Graph**: Renders a node-link network map of student submissions. Edge lines indicate shared phrasing or structures, exposing copycat circles.
- **Targeted Code/Text Checkers**: Runs deterministic checks to spot unauthorized boilerplate, template copy-pasting, or unauthorized structural alignment.
- **Template Configuration**: Instructors can upload assignment templates or boilerplate files. Submissions matching template rules are automatically whitelisted so templates don't flag as plagiarism.
- **Dispute Resolution Hub**: Students can contest flagged submissions. Instructors can review the student's arguments and either approve (clearing the flag) or reject the dispute.

### 🎓 2. Student Portal & Submission Hub
Allows students to submit work and review initial structural feedback.
- **Submission Upload Portal**: Submit text files against active course assignments.
- **Instant Status Indicators**: Real-time status badges showing whether a paper is `pending`, `clean`, `flagged_ai`, `flagged_plagiarism`, or `disputed`.
- **Dispute Submission Form**: If flagged, students can write and send a dispute form explaining their methodology to clear their work.

### 🧪 3. Research Gap Finder (Automatic Gap Generator)
Helps students and researchers find novelty targets.
- **Contribution Extraction**: Scrapes text to locate assertions of contribution.
- **Deterministic Gap Generation**: Compares contributions against past work keywords and outputs a structured matrix showing what is already explored versus unexplored fields.

### 🔬 4. Academic Insight Analyzer (Grounding & Overlap Engine)
A deterministic engine evaluating paper collections (100% trace-to-text, zero hallucination).
- **Evidence Reliability Analyzer**: Checks sentences for dataset citations, methodology specifications, statistical indicators ($p$-values, confidence levels), limitations, future work directions, and performance metrics. Returns a 0-100 grounding score and lists structural weaknesses.
- **Claim Relationship Graph**: Dynamically charts links between paper claims. Connects nodes ONLY when they share a catalogued scientific concept AND a research intent signal (e.g. extending or contradicting). Edge details include a deterministic explanation and confidence level.
- **Research Evolution Timeline**: Chronologically orders papers and clusters emerging concepts, methodologies, and findings.
- **Corpus-level Concept Cloud**: Ranks scientific terms based on specificity in our taxonomy catalog times cross-paper appearance, displaying a font-sized chip cloud.

---

## 💻 Getting Started

### 📋 Prerequisites
- Node.js (v22.x or higher recommended)
- pnpm (`npm i -g pnpm`)
- PostgreSQL instance running locally or hosted

### ⚙️ Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/integrity_forge
CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
CLERK_SECRET_KEY=your_clerk_secret_key
PORT=8080
```

### 📦 Installation
```bash
pnpm install
```

### 🗄️ Database Setup & Migrations
```bash
pnpm --filter @workspace/db run push
```

### ⚡ Running the Applications
```bash
# Start backend server
pnpm --filter @workspace/api-server run dev

# Start Vite frontend dev server
pnpm --filter @workspace/integrity-forge run dev
```

---

## 🧪 Testing & Verification

### Unit Tests
```bash
pnpm --filter @workspace/api-server run test
```

### Type Checking
```bash
pnpm run typecheck
```

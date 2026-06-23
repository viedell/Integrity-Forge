# IntegrityForge

Academic integrity analysis platform for universities — detects AI-generated content and plagiarism, with a student dispute pipeline, instructor collusion graph, and admin console.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/integrity-forge run dev` — run the frontend (port 20816)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Frontend: React + Vite + Tailwind CSS + shadcn/ui
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle table definitions (assignments, submissions, disputes, templates, similarity_edges, activity)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/integrity-forge/src/` — React frontend (pages: Home, StudentPortal, InstructorDashboard, AdminConsole)

## Architecture decisions

- `serializeDates()` utility in `artifacts/api-server/src/lib/serialize.ts` must wrap all Drizzle query results before Zod `.parse()` — Drizzle returns `Date` objects for `timestamp` columns but Zod expects strings.
- AI analysis scores are simulated server-side on submission (`Math.random()`). In production, replace with actual ONNX model inference.
- Similarity edges are stored in `similarity_edges` table; the `/similarity-graph` endpoint builds graph nodes from submissions and edges above a configurable threshold.
- Activity feed is an append-only log written by route handlers (submissions, disputes) to give the admin console a live audit trail.

## Product

- **Student Portal** (`/student`): Submit assignments for pre-check AI/plagiarism analysis, view scores, file disputes for false-positive flags
- **Instructor Dashboard** (`/instructor`): View assignments with submission stats, force-directed SVG collusion graph, approve/reject disputes, upload skeleton code templates
- **Admin Console** (`/admin`): Dashboard stats (Recharts), recent activity feed, global submissions list

## Gotchas

- Always wrap DB results with `serializeDates()` before Zod `.parse()` in route handlers — missing this causes a ZodError ("expected string, received date").
- `pnpm --filter @workspace/api-spec run codegen` must be re-run after every OpenAPI spec change.
- The `integrity-forge` artifact is at `previewPath: "/"` — it's the root app.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

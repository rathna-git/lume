# Lume — Build Progress

> **Architecture reference:** [ARCHITECTURE.md](./ARCHITECTURE.md) — full system design, route map, data models, and tradeoffs.

---

## 2026-03-11

### Database Layer
- Created `prisma/schema.prisma` — full data model with 5 models and 2 enums
- Created `lib/prisma.ts` — singleton Prisma client (prevents connection exhaustion in dev)
- Renamed git default branch from `master` to `main` (local + remote)
- Fixed local branch upstream tracking to `origin/main`
- Set up Neon (serverless PostgreSQL) as the database provider
- Ran first migration (`20260311200403_init`) — all 5 tables created in Neon

### Files Created / Modified
| File | Status | Notes |
|---|---|---|
| `prisma/schema.prisma` | Created | User, Workspace, Document, Tag, AiGeneration models + enums |
| `lib/prisma.ts` | Created | Singleton pattern via globalThis — safe for Next.js hot reload |
| `prisma/migrations/20260311200403_init/migration.sql` | Created | First migration — creates all tables in Neon |
| `ARCHITECTURE.md` | Modified | Marked shared env, prisma singleton, prisma schema, and first migration as done |

### Decisions Made
- `@db.Text` on all long text fields (content, summary, prompt, etc.) — avoids VARCHAR(191) length limit
- `output Json?` on AiGeneration — flexible structure for different AI action result shapes
- `inputSnapshot` on AiGeneration — captures document state at time of AI call for auditability
- Many-to-many Tags ↔ Documents via Prisma implicit join table (`_DocumentTags`)
- Using Neon (serverless Postgres on AWS US-West-2) — free tier, pairs well with Vercel for production

### Up Next
- TanStack Query provider
- Clerk setup in root layout

---

## 2026-03-10

### Architecture & Planning
- Reordered implementation checklist in `ARCHITECTURE.md` to a safer MVP workflow — webhook sync moved to post-MVP
- Added Key Decision: server-side user bootstrap instead of webhook-first sync for local dev simplicity

### Environment Setup
- Created `.env.example` — committed template documenting all required environment variables
- Created `.env.local` — git-ignored file for real secrets (placeholders, to be filled in)
- Updated `.gitignore` — changed `.env*` wildcard to explicit entries so `.env.example` is committed
- Created `lib/env.ts` — server-side config module that validates required env vars at boot time

### Git
- Renamed default branch from `master` to `main` (local + remote)

### Files Created / Modified
| File | Status | Notes |
|---|---|---|
| `.env.example` | Created | Template for DATABASE_URL, Clerk keys, OpenAI key, Clerk redirect URLs |
| `.env.local` | Created | Git-ignored; real secrets go here |
| `.gitignore` | Modified | Allow `.env.example` to be committed |
| `lib/env.ts` | Created | Server-only env validation; import this instead of `process.env` directly |
| `ARCHITECTURE.md` | Modified | Reordered implementation checklist; added bootstrap decision |

### Decisions Made
- Public landing page stays hardcoded dark (intentional brand statement) — not tied to theme system
- Protected app interior will be built light-mode-first using semantic tokens (`bg-background`, `text-foreground`, etc.)
- Dark mode infrastructure (`.dark` class, CSS vars) preserved for future theme toggle

---

## 2026-03-09

### Infrastructure
- Initialized Next.js 16 with App Router, TypeScript, Tailwind CSS v4, ESLint
- Set up pnpm as package manager
- Installed all core dependencies:
  - `@clerk/nextjs` — authentication
  - `@prisma/client` + `prisma` v6 — database ORM (downgraded from v7 for Node 20.10 compatibility)
  - `@tanstack/react-query` + devtools — server state management
  - `zod` — schema validation
  - `openai` — AI content generation
  - `shadcn/ui` — component library (initialized with defaults)
  - `lucide-react` — icons
  - `class-variance-authority`, `clsx`, `tailwind-merge` — styling utilities

### Brand & Design System
- Reviewed brand identity file (`lume-brand.html`) and logo system (`lume-logo.html`)
- Extracted and applied full Lume brand system:
  - **Fonts:** DM Serif Display (headlines, wordmark) + DM Sans 300–500 (body, UI)
  - **Colors:** Gold `#F7C948`, Amber `#F5A623`, Dusk `#E8724A`, Ink `#1A1410`, Warm White `#FFF8F0`, Mist `#F2EDE8`
  - **Gradient:** `135deg → #F7C948 → #F5A623 → #E8724A`
  - **Tagline chosen:** *"Think clearly. Write better. Learn faster."*
  - **Logo mark:** 4-layer CSS orb (outer ring, mid ring, core glow, spark) — animates on hero

### Files Created / Modified
| File | Status | Notes |
|---|---|---|
| `app/globals.css` | Modified | Brand CSS vars, shadcn token overrides, lume animations |
| `app/layout.tsx` | Modified | DM Sans + DM Serif Display via next/font, metadata |
| `components/logo.tsx` | Created | `<LumeMark>` animated icon + `<LumeLogo>` wordmark component |
| `app/page.tsx` | Modified | Landing page — hero, features grid, footer |

### Decisions Made
- Using **pnpm** over npm/bun for speed + compatibility
- Using **Prisma v6** (not v7) due to Node.js 20.10 version constraint (v7 requires 20.19+)
- **No `src/` directory** — `app/`, `components/`, `lib/` at root level
- `@/*` import alias configured

---

## Backlog / Up Next
- [ ] Fill in `.env.local` with real DATABASE_URL, Clerk keys, OpenAI key
- [ ] `lib/prisma.ts` — Prisma singleton client
- [ ] `prisma/schema.prisma` — data models
- [ ] First database migration
- [ ] TanStack Query provider
- [ ] Clerk setup in root layout + auth pages
- [ ] Middleware — route protection

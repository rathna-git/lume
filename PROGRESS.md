# Lume — Build Progress

> **Architecture reference:** [ARCHITECTURE.md](./ARCHITECTURE.md) — full system design, route map, data models, and tradeoffs.

---

## 2026-03-13

### Document Layer (API + Frontend)

#### Workspace detail API (`app/api/workspaces/[workspaceId]/route.ts`)
- `GET /api/workspaces/[workspaceId]` — returns workspace only if owned by authenticated user; 401 if unauth, 404 if not found/not owned

#### Document API (`app/api/documents/route.ts`)
- `GET /api/documents?workspaceId=` — returns documents for a workspace; verifies workspace ownership before returning
- `POST /api/documents` — Zod-validated body (`workspaceId`, `title?`); defaults title to `"Untitled"`, content to `""`; verifies workspace ownership before creating

#### Frontend
- `hooks/use-documents.ts` — `useDocuments(workspaceId)` (GET) + `useCreateDocument()` (POST); per-workspace cache key `["documents", workspaceId]`; invalidates on successful create
- `components/document/document-card.tsx` — clickable card linking to `/workspaces/[id]/documents/[documentId]`; shows title, summary, last updated date
- `app/(dashboard)/workspaces/[workspaceId]/page.tsx` — workspace detail page: header with emoji + workspace name, "New Document" button, loading skeletons, empty state, error state, responsive 1→2→3 grid
- "New Document" creates immediately with defaults and redirects to future editor route

### Files Created / Modified
| File | Status | Notes |
|---|---|---|
| `app/api/workspaces/[workspaceId]/route.ts` | Created | GET single workspace with ownership check |
| `app/api/documents/route.ts` | Created | GET list + POST create with Zod validation |
| `hooks/use-documents.ts` | Created | TanStack Query hooks for document CRUD |
| `components/document/document-card.tsx` | Created | Clickable card with title, summary, date |
| `app/(dashboard)/workspaces/[workspaceId]/page.tsx` | Created | Workspace detail page with document list |

### Up Next
- Document editor page (`/workspaces/[id]/documents/[documentId]`)
- `app/api/documents/[documentId]/route.ts` — GET + PATCH + DELETE
- `hooks/use-document.ts` — single document fetch + autosave mutation

---

## 2026-03-12

### Workspace Layer (API + Frontend)

#### Bootstrap optimization
- Replaced `prisma.user.upsert` (ran on every request) with `findUnique` + conditional create — returning users now hit one fast SELECT, no write
- New user bootstrap uses `prisma.$transaction` to atomically create the `User` row + a default `"My Workspace"` — both succeed or both fail

#### Workspace API (`app/api/workspaces/route.ts`)
- `GET /api/workspaces` — returns `{ workspaces: [...] }` ordered by `updatedAt desc`
- `POST /api/workspaces` — Zod-validated body (`name`, `description?`, `emoji?`), returns `{ workspace }` with 201
- `lib/auth.ts` — `requireCurrentDbUser()` helper: bridges Clerk session → Neon DB user; reused by all API routes

#### Frontend
- `hooks/use-workspaces.ts` — `useWorkspaces()` (GET) + `useCreateWorkspace()` (POST); invalidates list on successful create
- `components/workspace/workspace-card.tsx` — whole-card `<Link>` to `/workspaces/[id]`; emoji, name, description; minimal premium styling
- `app/(dashboard)/workspaces/page.tsx` — real workspace list with loading skeletons, empty state, error state, responsive 1→2→3 grid, "New Workspace" button
- Create workspace dialog — modal form with name (required), description, emoji; closes and refetches on success

### Files Created / Modified
| File | Status | Notes |
|---|---|---|
| `app/(dashboard)/layout.tsx` | Modified | Bootstrap optimized: findUnique + conditional create with transaction |
| `lib/auth.ts` | Created | `requireCurrentDbUser()` — Clerk → DB user bridge |
| `app/api/workspaces/route.ts` | Created | GET + POST with Zod validation |
| `hooks/use-workspaces.ts` | Created | TanStack Query hooks for workspace CRUD |
| `components/workspace/workspace-card.tsx` | Created | Whole-card link, minimal styling |
| `app/(dashboard)/workspaces/page.tsx` | Modified | Real page replacing placeholder |
| `components/ui/dialog.tsx` | Created | shadcn dialog (base-ui) |
| `components/ui/input.tsx` | Created | shadcn input (base-ui) |

### Up Next
- Workspace detail page (`/workspaces/[workspaceId]`) — document list inside a workspace
- Document API routes (GET list, POST create)
- Document editor + autosave

---

### App Shell + User Bootstrap
- Created `app/(dashboard)/layout.tsx` — server component; calls `auth()` + `currentUser()`, upserts user into Neon DB on every request, renders sidebar + header shell
- Created `app/(dashboard)/page.tsx` — redirects `/` inside dashboard to `/workspaces`
- Created `app/(dashboard)/workspaces/page.tsx` — placeholder workspace list page
- Created `components/layout/sidebar.tsx` — left nav with active link highlighting (`usePathname`), Clerk `UserButton` at bottom
- Created `components/layout/header.tsx` — top bar, accepts optional `title` prop
- Fixed `middleware.ts` — changed `export default` to `export const middleware` for Next.js 16 compatibility
- Fixed `app/layout.tsx` — replaced deprecated `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` with `signInFallbackRedirectUrl`/`signUpFallbackRedirectUrl` props on `ClerkProvider` (Clerk v7 breaking change)
- Tested: sign-in redirects to `/workspaces`, DB user row created in Neon on first visit, sign-out redirects to landing page

### Files Created / Modified
| File | Status | Notes |
|---|---|---|
| `app/(dashboard)/layout.tsx` | Created | Server component — user bootstrap + app shell |
| `app/(dashboard)/page.tsx` | Created | Redirects to `/workspaces` |
| `app/(dashboard)/workspaces/page.tsx` | Created | Placeholder |
| `components/layout/sidebar.tsx` | Created | Nav + active state + Clerk UserButton |
| `components/layout/header.tsx` | Created | Top bar with optional title |
| `middleware.ts` | Modified | `export const middleware` (Next.js 16 named export requirement) |
| `app/layout.tsx` | Modified | Clerk v7 redirect props on `ClerkProvider` |

### Up Next
- Workspace API routes (GET list, POST create)
- Default workspace auto-creation
- Workspace list page with cards

---

### Clerk Auth Setup
- Added `ClerkProvider` to `app/layout.tsx` — outermost wrapper, makes session available everywhere
- Created `app/(auth)/sign-in/[[...sign-in]]/page.tsx` — Clerk hosted sign-in UI
- Created `app/(auth)/sign-up/[[...sign-up]]/page.tsx` — Clerk hosted sign-up UI
- Created `middleware.ts` — route protection; public routes: `/`, `/sign-in`, `/sign-up`; all others require auth
- Tested: landing loads freely, `/workspaces` redirects to sign-in, sign-in UI renders correctly

### Files Created / Modified
| File | Status | Notes |
|---|---|---|
| `app/layout.tsx` | Modified | Added `ClerkProvider` as outermost wrapper |
| `app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Created | Clerk `<SignIn />` component, centered layout |
| `app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Created | Clerk `<SignUp />` component, centered layout |
| `middleware.ts` | Created | `clerkMiddleware` + `createRouteMatcher` for route protection |

### Up Next
- Protected app shell (sidebar + header)

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

### TanStack Query Provider
- Created `components/providers.tsx` — `QueryClientProvider` + `ReactQueryDevtools` wrapper
- Updated `app/layout.tsx` — wrapped `{children}` with `<Providers>`
- Pattern: API routes + `useQuery`/`useMutation` hooks (not Server Component fetching) — better fit for autosave and mutations

### Up Next
- Clerk setup in root layout
- Auth pages (sign-in / sign-up)

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

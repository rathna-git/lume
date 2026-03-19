# Lume — Architecture Reference

> This document reflects the **current** system design.
> When architecture changes, update this file in the same commit.
> Log the *reason* for the change in `PROGRESS.md`.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| Auth | Clerk |
| Database | PostgreSQL + Prisma v6 |
| Server state | TanStack Query v5 |
| Validation | Zod |
| AI | OpenAI (GPT-4o) |
| Package manager | pnpm |

---

## Folder Structure

```
app/
├── (auth)/
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
├── (dashboard)/
│   ├── layout.tsx                  ← app shell (sidebar + header)
│   ├── page.tsx                    ← redirects to /workspaces
│   ├── workspaces/
│   │   ├── page.tsx                ← workspace list
│   │   └── [workspaceId]/
│   │       ├── page.tsx            ← workspace overview + doc list
│   │       └── documents/
│   │           └── [documentId]/
│   │               └── page.tsx    ← document editor
│   └── settings/
│       └── page.tsx
├── api/
│   ├── webhooks/clerk/route.ts     ← sync Clerk user → DB
│   ├── workspaces/
│   │   ├── route.ts                ← GET list, POST create
│   │   └── [workspaceId]/route.ts  ← GET, PATCH, DELETE
│   ├── documents/
│   │   ├── route.ts                ← GET list, POST create
│   │   └── [documentId]/route.ts   ← GET, PATCH, DELETE
│   └── ai/
│       └── generate/route.ts       ← POST — AI actions
├── layout.tsx                      ← root layout, fonts, metadata
└── page.tsx                        ← public landing page

components/
├── ui/                             ← shadcn (auto-generated, do not edit)
├── logo.tsx                        ← LumeMark + LumeLogo
├── layout/
│   ├── sidebar.tsx
│   ├── header.tsx
│   └── app-shell.tsx
├── workspace/
│   ├── workspace-card.tsx
│   └── workspace-form.tsx
└── document/
    ├── document-card.tsx
    └── document-editor.tsx

lib/
├── prisma.ts                       ← Prisma singleton client
├── openai.ts                       ← OpenAI singleton client
└── utils.ts                        ← cn() utility (shadcn)

hooks/
├── use-workspaces.ts               ← TanStack Query hooks
└── use-documents.ts

types/
└── index.ts                        ← shared TypeScript types

prisma/
└── schema.prisma
```

---

## Data Models

### Enums

```
AiActionType        SUMMARIZE | REWRITE | EXPAND | GENERATE_QUESTIONS | EXTRACT_ACTION_ITEMS
AiGenerationStatus  PENDING | SUCCESS | ERROR
```

### Models

```
User
  id        String   (cuid)
  clerkId   String   (unique)
  email     String   (unique)
  name      String?
  imageUrl  String?
  └── Workspace[]

Workspace
  id          String
  name        String
  description String?
  emoji       String?   default "📝"
  userId      String    → User (cascade delete)
  └── Document[]
  @@index([userId])

Document
  id          String
  title       String
  content     String?        (Text)
  summary     String?        (Text)
  workspaceId String         → Workspace (cascade delete)
  ├── Tag[]                  (many-to-many)
  └── AiGeneration[]
  @@index([workspaceId])

Tag
  id        String
  name      String
  color     String?   default "#F5A623"
  └── Document[]      (many-to-many)

AiGeneration
  id            String
  type          AiActionType
  status        AiGenerationStatus   default PENDING
  prompt        String?              (Text)
  inputSnapshot String?              (Text) — document content at time of generation
  output        Json?                — flexible output structure
  errorMessage  String?              (Text)
  model         String               default "gpt-4o"
  documentId    String               → Document (cascade delete)
  @@index([documentId])
  @@index([type])
  @@index([status])
```

---

## Type & State Ownership

| Data | Owner | Mechanism |
|---|---|---|
| Auth session | Clerk | `auth()` server-side / `useUser()` client |
| Current user (DB) | Prisma User | Fetched server-side in layouts |
| Workspaces list | TanStack Query | `useWorkspaces()` |
| Active workspace | TanStack Query | `useWorkspace(id)` |
| Documents list | TanStack Query | `useDocuments(workspaceId)` |
| Document content | Local `useState` | Debounced auto-save via `useMutation` |
| AI generations (persisted) | Prisma AiGeneration | Written by `POST /api/ai/generate`; read flow not yet implemented |
| AI panel result (ephemeral) | Local `useState` | Immediate mutation response shown in UI until dismissed |

---

## Route Map

| Route | Type | Description |
|---|---|---|
| `/` | Public page | Landing page |
| `/sign-in` | Auth page | Clerk sign-in |
| `/sign-up` | Auth page | Clerk sign-up |
| `/workspaces` | Protected page | Workspace list |
| `/workspaces/[id]` | Protected page | Workspace + document list |
| `/workspaces/[id]/documents/[id]` | Protected page | Document editor |
| `/settings` | Protected page | User settings |
| `POST /api/webhooks/clerk` | API | Sync Clerk user to DB |
| `GET/POST /api/workspaces` | API | List / create workspaces |
| `GET/PATCH/DELETE /api/workspaces/[id]` | API | Single workspace |
| `GET/POST /api/documents` | API | List / create documents |
| `GET/PATCH/DELETE /api/documents/[id]` | API | Single document |
| `POST /api/ai/generate` | API | AI content actions |
| `GET /api/documents/[id]/generations` | API | Fetch saved AI generations for a document (planned) |

---

## Loading / Error / Empty States

| Screen | Loading | Error | Empty |
|---|---|---|---|
| Workspace list | Skeleton cards | Toast + retry | "Create your first workspace" CTA |
| Document list | Skeleton rows | Toast + retry | "No documents yet" with create button |
| Document editor | Spinner overlay | Inline error banner | Blank editor ready to type |
| AI generate | Button spinner | Inline error below toolbar | — |
| AI history (planned) | Skeleton panel | Toast + retry | "No generations yet" message |

---

## AI Generation Flow

### Current

- `POST /api/ai/generate` creates an `AiGeneration` row with `PENDING`
- OpenAI is called with the requested action
- The row is updated to `SUCCESS` or `ERROR`
- The immediate response is shown in the UI
- Saved generations are not yet read back from the database

### Planned

- Fetch saved generations per document
- Show latest saved generation by default
- Support history and explicit regenerate behavior
- Refresh persisted generations after successful mutation

---

## Key Decisions & Tradeoffs

| Decision | Reason | Tradeoff |
|---|---|---|
| API routes over Server Actions | Easier to test, reusable from hooks | More boilerplate |
| Clerk webhook for user sync | Clean separation of auth and DB | Needs public URL in dev (ngrok) |
| Debounced auto-save | Better UX than manual save | Risk of content loss on abrupt close |
| Prisma v6 (not v7) | Node.js 20.10 compatibility | Miss v7 features; upgrade when Node is updated |
| No real-time (Phase 1) | Simpler architecture | Two tabs editing same doc will conflict |
| Tags as many-to-many | Proper relational model | Join table adds complexity; simplify to string[] if needed |
| No `src/` directory | Flatter, cleaner root | Personal preference — consistent across team |
| Use server-side user bootstrap for MVP instead of webhook-first sync | Simplifies local development and avoids ngrok/webhook setup during early build phase | Webhook still required later for production-grade sync guarantees |
| Persist AI generations before building read flow | Preserves outputs and avoids schema churn later | UI currently behaves as if AI results are temporary |
| Split page into shell + editor components for async data init | Avoids `useEffect` state seeding; state initialized directly from props at mount | Adds one level of component nesting |

---

## Implementation Order

- [x] Next.js scaffold + dependencies
- [x] Brand system (fonts, colors, animations)
- [x] Logo component + landing page
- [x] Shared env/config setup
- [x] `lib/prisma.ts` singleton
- [x] Prisma schema
- [x] First migration
- [x] TanStack Query provider
- [x] Clerk setup in root layout
- [x] Auth pages (sign-in / sign-up)
- [x] Middleware — route protection
- [x] Protected app shell (sidebar + header)
- [x] Server-side user bootstrap (create DB user on first request)
- [x] Default workspace creation
- [x] Workspace API routes
- [x] Workspace pages
- [x] Document API routes (GET list, POST create)
- [x] Workspace detail page (document list)
- [x] Document editor + autosave
- [x] AI route
- [x] Document delete

---

## Pending Work (Ordered by Importance)

### High Priority

- [x] Add document delete feature
- [x] Add workspace PATCH route (rename + description update)
- [x] Add workspace rename UI flow
- [x] Add workspace DELETE route
- [x] Add workspace delete UI flow
- [ ] Add AI generations read route (`GET /api/documents/[id]/generations`) — returns all generations for a document, newest first; auth via document ownership
- [ ] Add `useAiGenerations(documentId)` TanStack Query hook — fetches from the above route; invalidated after successful AI mutation
- [ ] Surface latest persisted AI generation in the document editor — show most recent SUCCESS generation output in the AI panel on load
- [ ] Invalidate AI generations query after successful AI mutation

### Medium Priority

- [ ] Add AI history panel per document
- [ ] Add explicit regenerate flow separate from viewing existing results
- [ ] Add loading / empty / error states for AI history retrieval
- [ ] Audit persisted server data currently held only in local UI state

### Lower Priority

- [ ] Add filtering / sorting for AI generations
- [ ] Define retention / versioning strategy for AI outputs
- [ ] Harden Clerk webhook sync flow post-MVP

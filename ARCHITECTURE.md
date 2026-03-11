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
| AI result | Local `useState` | Cleared after applying to editor |

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

---

## Loading / Error / Empty States

| Screen | Loading | Error | Empty |
|---|---|---|---|
| Workspace list | Skeleton cards | Toast + retry | "Create your first workspace" CTA |
| Document list | Skeleton rows | Toast + retry | "No documents yet" with create button |
| Document editor | Spinner overlay | Inline error banner | Blank editor ready to type |
| AI generate | Button spinner | Inline error below toolbar | — |

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

---

## Implementation Order

- [x] Next.js scaffold + dependencies
- [x] Brand system (fonts, colors, animations)
- [x] Logo component + landing page
- [x] Shared env/config setup
- [x] `lib/prisma.ts` singleton
- [x] Prisma schema
- [x] First migration
- [ ] TanStack Query provider
- [ ] Clerk setup in root layout
- [ ] Auth pages (sign-in / sign-up)
- [ ] Middleware — route protection
- [ ] Protected app shell (sidebar + header)
- [ ] Server-side user bootstrap (create DB user on first request)
- [ ] Default workspace creation
- [ ] Workspace API routes
- [ ] Workspace pages
- [ ] Document API routes
- [ ] Document editor + autosave
- [ ] AI route
- [ ] Clerk webhook — sync hardening (post-MVP)

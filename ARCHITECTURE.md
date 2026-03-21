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
│   ├── layout.tsx                  ← app shell + user bootstrap
│   ├── page.tsx                    ← redirects to /workspaces
│   ├── workspaces/
│   │   ├── page.tsx                ← workspace list + create dialog
│   │   └── [workspaceId]/
│   │       ├── page.tsx            ← workspace detail + doc list + rename/delete
│   │       └── documents/
│   │           └── [documentId]/
│   │               └── page.tsx    ← document editor + AI panel
│   └── settings/
│       └── page.tsx
├── api/
│   ├── workspaces/
│   │   ├── route.ts                ← GET list, POST create
│   │   └── [workspaceId]/route.ts  ← GET, PATCH, DELETE
│   ├── documents/
│   │   ├── route.ts                ← GET list, POST create
│   │   └── [documentId]/
│   │       ├── route.ts            ← GET, PATCH, DELETE
│   │       └── generations/route.ts← GET — AI generations for document
│   └── ai/
│       └── generate/route.ts       ← POST — AI actions (summarize/rewrite/expand)
├── layout.tsx                      ← root layout, fonts, metadata
└── page.tsx                        ← public landing page

components/
├── ui/                             ← shadcn primitives (button, dialog, input)
├── logo.tsx                        ← LumeMark + LumeLogo
├── providers.tsx                   ← TanStack Query provider + devtools
├── layout/
│   ├── sidebar.tsx                 ← nav + active state + Clerk UserButton
│   └── header.tsx                  ← top bar with optional title
├── workspace/
│   └── workspace-card.tsx          ← clickable card linking to workspace
└── document/
    └── document-card.tsx           ← clickable card linking to document editor

lib/
├── prisma.ts                       ← Prisma singleton client
├── openai.ts                       ← OpenAI singleton client
├── auth.ts                         ← requireCurrentDbUser() — Clerk → DB bridge
├── env.ts                          ← server-side env validation
└── utils.ts                        ← cn() utility (shadcn)

hooks/
├── use-workspaces.ts               ← useWorkspaces, useCreateWorkspace, useUpdateWorkspace, useDeleteWorkspace
├── use-documents.ts                ← useDocuments, useCreateDocument
├── use-document.ts                 ← useDocument, useUpdateDocument, useDeleteDocument
└── use-ai.ts                       ← useGenerateAi, useAiGenerations

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
| AI generations (persisted) | TanStack Query | `useAiGenerations(documentId)` — keyed `["aiGenerations", documentId]`; `staleTime: Infinity`; invalidated after successful mutation |
| AI panel selected action | Local `useState` | `selectedAction` — which action tab is active; drives what persisted result is shown |
| AI panel pending action | Local `useState` | `pendingAction` — in-flight action; clears on success/error; all generate buttons disabled while set |

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
| `GET /api/documents/[id]/generations` | API | Fetch saved AI generations for a document, newest first |

---

## Loading / Error / Empty States

| Screen | Loading | Error | Empty |
|---|---|---|---|
| Workspace list | Skeleton cards | Toast + retry | "Create your first workspace" CTA |
| Document list | Skeleton rows | Toast + retry | "No documents yet" with create button |
| Document editor | Pulse skeleton card | Inline "Document not found" | Blank editor ready to type |
| AI generate | "Running…" on button, disabled state | — (error silently clears pendingAction) | "No {action} yet" + Generate button |
| AI panel | — (uses cached data instantly) | — | Per-action empty state with Generate CTA |

---

## AI Generation Flow

### Current

- `POST /api/ai/generate` creates an `AiGeneration` row with `PENDING`
- OpenAI is called with the requested action
- The row is updated to `SUCCESS` or `ERROR` with `inputSnapshot` capturing document content at call time
- `GET /api/documents/[id]/generations` returns all saved generations newest-first, including `inputSnapshot`
- `useAiGenerations(documentId)` fetches and caches saved generations (`staleTime: Infinity`); invalidated after each successful mutation
- Editor uses a two-surface layout: editor card (left) + AI panel (right, sticky)
- AI panel is action-driven: selecting a tab shows the latest `SUCCESS` generation for that type
- Staleness: shown when `content !== inputSnapshot && content !== outputText` — clears after "Replace content" because content then matches the output exactly
- Regenerate always available when a result exists; fires the same mutation, creates a new row, invalidation refreshes the panel

### Planned

_(none — all planned items shipped)_

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
| `staleTime: Infinity` on `useAiGenerations` | Generations only change when the user explicitly runs a new action — no background source can mutate them | Must ensure `invalidateQueries` is always called after successful mutation or cache will be stale |
| AI panel action tabs select view, not trigger generation | Separates navigation from side effects — user can browse results without accidentally firing API calls | Generate/Regenerate must be a deliberate explicit action |
| `inputSnapshot` staleness over timestamp-based staleness | Content drift is the relevant signal, not time; comparing snapshots directly tells us whether the result is still valid for the current document | Simple string equality — no diffing, no normalization; whitespace differences will mark as stale |
| Staleness clears when `content === outputText` | "Replace content" sets editor to the AI output, so the result is immediately valid — stale note should not fire | Relies on exact string equality; any post-replace edit re-triggers stale correctly |
| `proxy.ts` instead of `middleware.ts` | Next.js 16 deprecated the `middleware` file convention in favour of `proxy` | Rename required; export name also changed from `middleware` to `proxy` |
| Single `pendingAction` state gates all generate buttons | Prevents overlapping mutations and keeps panel state predictable | Only one action can run at a time; users cannot queue multiple generations |

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
- [x] AI route (POST generate — summarize / rewrite / expand)
- [x] Document delete
- [x] Workspace PATCH route + rename UI
- [x] Workspace DELETE route + delete UI (cascade via Prisma)
- [x] AI generations read route (GET — auth + ownership + newest-first)
- [x] `useAiGenerations` hook (`staleTime: Infinity`, invalidated after mutation)
- [x] Two-surface editor layout (editor card + persistent AI panel)
- [x] Action-driven AI panel (tabs select view; Generate / Regenerate explicit; staleness via `inputSnapshot`)

---

## Pending Work (Ordered by Importance)

### High Priority

- [x] Add document delete feature
- [x] Add workspace PATCH route (rename + description update)
- [x] Add workspace rename UI flow
- [x] Add workspace DELETE route
- [x] Add workspace delete UI flow
- [x] Add AI generations read route (`GET /api/documents/[id]/generations`) — returns all generations for a document, newest first; auth via document ownership
- [x] Add `useAiGenerations(documentId)` TanStack Query hook — fetches from the above route; invalidated after successful AI mutation
- [x] Surface latest persisted AI generation in the document editor — persistent right-side AI panel replaces below-fold result block
- [x] Invalidate AI generations query after successful AI mutation

### Medium Priority

- [ ] Deployment pass — deploy to Vercel, wire production env vars, verify all features end-to-end in prod
- [x] Add AI history panel per document — action-driven panel shows latest persisted result per action type; history list shows older results per action with relative timestamps and snippet previews
- [x] Add explicit regenerate flow separate from viewing existing results
- [x] Add loading / empty / error states for AI history retrieval
- [ ] Audit persisted server data currently held only in local UI state

### Lower Priority

- [ ] Render AI panel output as markdown (react-markdown) — bold, code, lists display correctly in panel; precursor to rich text editor
- [ ] Replace `<textarea>` editor with Tiptap rich text editor — enables formatting toolbar, and allows markdown-to-rich-text insert from AI panel
- [ ] Replace `confirm()` on document delete with a proper confirmation dialog (same pattern as workspace delete)
- [ ] Conditionally adjust workspace delete dialog copy — omit "and all documents inside it" when workspace is empty
- [ ] Add filtering / sorting for AI generations
- [ ] Define retention / versioning strategy for AI outputs
- [ ] Harden Clerk webhook sync flow post-MVP

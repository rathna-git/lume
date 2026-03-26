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
│       └── page.tsx                ← placeholder settings page
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
├── globals.css                     ← global styles, brand tokens, Tiptap ProseMirror styles
├── layout.tsx                      ← root layout, fonts, metadata
└── page.tsx                        ← public landing page

components/
├── ui/                             ← shadcn primitives (button, dialog, input)
├── logo.tsx                        ← LumeMark + LumeLogo
├── providers.tsx                   ← TanStack Query provider + devtools (dev only)
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
├── utils.ts                        ← cn() utility (shadcn)
└── rate-limit.ts                   ← in-memory sliding window rate limiter (per-user, reusable)

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
  createdAt DateTime
  updatedAt DateTime
  └── Workspace[]

Workspace
  id          String
  name        String
  description String?
  emoji       String?   default "📝"
  createdAt   DateTime
  updatedAt   DateTime
  userId      String    → User (cascade delete)
  └── Document[]
  @@index([userId])

Document
  id          String
  title       String
  content     String?        (Text) — stored as HTML (Tiptap)
  summary     String?        (Text)
  createdAt   DateTime
  updatedAt   DateTime
  workspaceId String         → Workspace (cascade delete)
  ├── Tag[]                  (many-to-many)
  └── AiGeneration[]
  @@index([workspaceId])

Tag
  id        String
  name      String
  color     String?   default "#F5A623"
  createdAt DateTime
  └── Document[]      (many-to-many)

AiGeneration
  id            String
  type          AiActionType
  status        AiGenerationStatus   default PENDING
  prompt        String?              (Text)
  inputSnapshot String?              (Text) — plain text snapshot via textBetween at generation time
  output        Json?                — { text: string } — AI markdown output
  errorMessage  String?              (Text)
  model         String               default "gpt-4o"
  createdAt     DateTime
  updatedAt     DateTime
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
| Active workspace | TanStack Query | `useWorkspace(id)` — local hook defined in the workspace detail page; not in global `hooks/`; keyed `["workspace", workspaceId]` |
| Documents list | TanStack Query | `useDocuments(workspaceId)` |
| Document content | Local `useState` | Debounced auto-save via `useMutation` |
| AI generations (persisted) | TanStack Query | `useAiGenerations(documentId)` — keyed `["aiGenerations", documentId]`; `staleTime: Infinity`; invalidated after successful mutation |
| AI panel selected action | Local `useState` | `selectedAction` — which action tab is active; drives what persisted result is shown |
| AI panel pending action | Local `useState` | `pendingAction` — in-flight action; clears on success/error; all generate buttons disabled while set |
| Replaced generation ID | Local `useState` | `replacedGenerationId` — tracks which generation's output is currently in the editor via Replace content; drives "Revert to original" button visibility, `isAlreadyApplied` check, and `isStale` suppression; cleared on user edits or Insert at cursor |
| Pre-replace HTML snapshot | Local `useRef` | `originalHtmlRef` — HTML captured at the moment "Replace content" fires; used to restore exact rich formatting on revert; cleared after revert or user edit |
| AI panel collapse state | Local `useState` | `resultCollapsed` in `AiPanel` — collapses everything below the result section header (pending, empty state, markdown, action buttons, history); default `false` (expanded) |

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
| `POST /api/webhooks/clerk` | API | Sync Clerk user to DB _(not implemented — server-side bootstrap used instead)_ |
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
| Workspace list | Skeleton cards | Inline "Something went wrong" text | "No workspaces yet" CTA |
| Document list | Skeleton rows | Inline "Something went wrong" text | "No documents yet" with create button |
| Document editor | Pulse skeleton card | Inline "Document not found" | Blank editor ready to type |
| AI generate | "Running…" on button, disabled state | Error silently clears `pendingAction` | "No {action} yet" + Generate button |
| AI panel | Animated skeleton (4 rows, action tab must be selected) | "Couldn't load your previous results." + "Try again" | Per-action empty state with Generate CTA |

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
- Staleness: shown when `replacedGenerationId !== displayed.id && content !== inputSnapshot` — suppressed immediately after "Replace content" via the ID check; `inputSnapshot` and `content` are both plain text (`textBetween`) so the comparison remains valid
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
| Persist AI generations before building read flow | Preserves outputs and avoids schema churn later | AI panel is now fully persistence-driven via `useAiGenerations` |
| Split page into shell + editor components for async data init | Avoids `useEffect` state seeding; state initialized directly from props at mount | Adds one level of component nesting |
| `staleTime: Infinity` on `useAiGenerations` | Generations only change when the user explicitly runs a new action — no background source can mutate them | Must ensure `invalidateQueries` is always called after successful mutation or cache will be stale |
| AI panel action tabs select view, not trigger generation | Separates navigation from side effects — user can browse results without accidentally firing API calls | Generate/Regenerate must be a deliberate explicit action |
| `inputSnapshot` staleness over timestamp-based staleness | Content drift is the relevant signal, not time; comparing snapshots directly tells us whether the result is still valid for the current document | Simple string equality — no diffing, no normalization; whitespace differences will mark as stale |
| `proxy.ts` instead of `middleware.ts` | Next.js 16 deprecated the `middleware` file convention in favour of `proxy` | Rename required; export name also changed from `middleware` to `proxy` |
| Single `pendingAction` state gates all generate buttons | Prevents overlapping mutations and keeps panel state predictable | Only one action can run at a time; users cannot queue multiple generations |
| Tiptap content stored as HTML; plain text extracted via `textBetween` for AI | AI needs plain text; editor needs HTML for rich formatting. `textBetween(0, size, "\n\n")` reproduces the paragraph-separated format previously stored in `inputSnapshot`, keeping staleness and revert comparisons valid | Old plain-text documents render correctly (Tiptap wraps in `<p>`); newly saved content is HTML |
| Custom `BubbleMenuReact` portal instead of Tiptap's BubbleMenu extension | Tiptap v3 dropped the React component wrapper from `@tiptap/react`; the extension is a bare ProseMirror plugin requiring manual DOM integration. A lightweight React component using `editor.on("selectionUpdate")` + `window.getSelection()` + `createPortal` is simpler and fully sufficient | No dependency on `@tiptap/extension-bubble-menu`; `onMouseDown` + `preventDefault` keeps selection alive when clicking menu buttons |
| `BubbleMenuReact` render prop for `flipLeft` | The overflow panel needs viewport-derived positioning computed inside `BubbleMenuReact` from `rect` + `window.innerWidth`. A render prop (`children: (opts: { flipLeft }) => ReactNode`) flows this info without prop-drilling | Overflow panel uses `position: absolute` horizontally — never clips at top or bottom; `showBelow` handles top-edge clipping for the pill |
| `marked.parse()` for AI replace/insert | AI output is markdown; Tiptap needs HTML. `marked.parse()` converts the full markdown AST (headings, bold, lists, code blocks). `textToHtml` helper removed after revert was redesigned to use `originalHtmlRef` | `marked.parse()` used synchronously (no async extensions); cast as `string` to satisfy TypeScript |
| `originalHtmlRef` for revert instead of `textToHtml(inputSnapshot)` | `inputSnapshot` is plain text (captured via `textBetween`); re-converting it to HTML strips all rich formatting. Capturing `editor.getHTML()` at the moment "Replace content" is clicked preserves the exact pre-replace state | Ref is cleared on user edits and after revert fires; `isReplacingRef` prevents `onUpdate` from clearing it during programmatic `setContent` calls |
| `replacedGenerationId` state replaces `content === outputText` for revert button | After `marked.parse()`, `textBetween` strips markdown syntax from rendered HTML so `content !== outputText` is always true — the revert button never showed. Explicit ID tracking is robust regardless of content format | `isReplacingRef` guards against `onUpdate` clearing the state when `setContent` fires synchronously inside `handleReplace` |
| OpenAI system message for consistent Markdown output | Without a system message, GPT-4o mirrors input style — plain prose input (from `textBetween` after a "Replace content") returns plain prose output. System message overrides this and ensures every generation is Markdown-formatted for `marked.parse()` | Applies to all three actions and all generations including regenerations; keeps user-facing prompts clean |
| `resultCollapsed` collapses the full result body, not just the markdown | Collapsing only the markdown area would leave orphaned action buttons with no visible content above them — confusing UX. Collapsing the entire body (pending/empty/markdown/buttons/history) keeps the panel clean and predictable when minimised | The section header (label + Regenerate/Back to latest + chevron) always stays visible so the user knows which action is selected |
| `isAlreadyApplied` disables only "Replace content", not "Insert at cursor" | Replace is a terminal state — the result IS the document, re-applying is a no-op. Insert at cursor is additive — users may want multiple insertions at different cursor positions, so it stays enabled. `isAlreadyApplied = displayed.id === replacedGenerationId`; derived inline, no new state or props | "Copy" also stays enabled; helper text below buttons explains the disabled state to users |
| OpenAI timeout set to 15s | Vercel serverless functions have a max execution time; a hung OpenAI call would silently consume it. 15s is tight enough to fail fast without cutting off normal generations (~3–8s). Timeout errors surface a distinct user message ("AI took too long to respond") rather than the generic failure copy | Aggressive timeout may occasionally reject slow-but-valid responses; can be raised if needed |

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
- [x] UI polish — Tiptap editor typography (line-height, heading hierarchy, list rhythm, block spacing)
- [x] UI polish — editor writing canvas constrained to `max-w-[680px]`; card/title/back-link vertical spacing refined
- [x] UI polish — AI panel spacing and readability; collapsible result section via `resultCollapsed`
- [x] UI polish — "Insert below" renamed to "Insert at cursor"; `editor.commands.insertContent()` inserts at preserved `editor.state.selection` regardless of focus
- [x] UI polish — `isAlreadyApplied` disables "Replace content" only (terminal state); "Insert at cursor" stays enabled (additive); helper text shown
- [x] UI polish — `sonner` toast notifications for Replace, Insert at cursor, Copy, Revert; Lume-themed via `toastOptions.style` + CSS icon override; `bottom-right` position
- [x] UI polish — AI panel history list changed to horizontal scroll; two cards visible, `ChevronRight` fade overlay when `olderGenerations.length > 2`; "Undo with Cmd+Z" hint below action buttons
- [x] UI polish — bubble menu visual refinement: solid `bg-card`, softer shadow/border, `rounded-md` buttons, soft active tint (`bg-foreground/10`), cleaner icon colors, `animate-in fade-in zoom-in-95` entry animation on pill and overflow panel
- [x] Rate limiting — `lib/rate-limit.ts` in-memory per-user limiter; 12 req/min sliding window; 429 returned before any OpenAI or DB work

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

- [x] Deployment pass — deployed to https://lume-psi-teal.vercel.app/; all features verified end-to-end in prod
- [x] Add AI history panel per document — action-driven panel shows latest persisted result per action type; history list shows older results per action with relative timestamps and snippet previews
- [x] Add explicit regenerate flow separate from viewing existing results
- [x] Add loading / empty / error states for AI history retrieval
- [x] Audit persisted server data currently held only in local UI state

### Lower Priority

- [x] Render AI panel output as markdown (react-markdown) — bold, code, lists display correctly in panel; precursor to rich text editor
- [x] Replace `<textarea>` editor with Tiptap rich text editor — StarterKit, custom `BubbleMenuReact` (portal-based, Tiptap v3 has no React wrapper), selection bubble menu with Bold/Italic/Strike/Code + overflow panel (Paragraph, H1-H3, lists, blockquote, code block, divider, undo/redo); content stored as HTML; plain text extracted via `textBetween` for AI and staleness comparisons; overflow panel side-floats via render prop + `position: absolute`; `marked.parse()` converts AI markdown to HTML on replace/insert; `originalHtmlRef` preserves formatting on revert; `replacedGenerationId` tracks replace state for revert button + staleness; OpenAI system message ensures markdown output on all generations
- [x] Replace `confirm()` on document delete with a proper confirmation dialog (same pattern as workspace delete)
- [x] Conditionally adjust workspace delete dialog copy — omit "and all documents inside it" when workspace is empty; reads `documents.length` from loaded `useDocuments` query
- [ ] Add filtering / sorting for AI generations
- [ ] Define retention / versioning strategy for AI outputs
- [ ] Harden Clerk webhook sync flow post-MVP
- [ ] Future: migrate document content storage to AWS S3 — store content as files in S3, save S3 URL in the Neon `Document` table instead of storing raw text in the DB; improves scalability for large documents
- [x] Add rate limiting to `POST /api/ai/generate` — in-memory per-user limiter (12 req/min); per-instance on Vercel, sufficient for v1
- [ ] **Rate limiting v2** — replace in-memory limiter with a distributed solution (e.g. Upstash Redis) so the limit is enforced globally across all Vercel instances
- [x] Add timeout to OpenAI API call — 15s timeout (`{ timeout: 15_000 }`); timeout errors return a distinct user-friendly message
- [x] Add error logging in API route catch blocks — `console.error` in `POST /api/ai/generate` catch; logs `generationId`, `documentId`, `action`, error message to Vercel function logs
- [x] `useDeleteDocument` should remove `["aiGenerations", documentId]` from query cache on success — prevents stale data if user navigates back
- [x] Clean up debounce timeout on editor unmount — `useEffect` cleanup calls `clearTimeout(debounceRef.current)` to prevent stale save after navigation
- [x] Disable "Replace content" when generation is already applied (`isAlreadyApplied = displayed.id === replacedGenerationId`); "Insert at cursor" intentionally stays enabled (additive action); helper text shown; "Copy" unaffected
- [x] **Revert to original (v1)** — after "Replace content" is clicked, show a "Revert to original" button that restores the editor to its pre-replace HTML (captured in `originalHtmlRef`); button visible when `replacedGenerationId === displayed.id`; disappears on further edits or insert below; triggers autosave on revert
- [ ] **Version history (v2)** — full document timeline across edits; allows users to browse and restore any prior state of the document, not just the last AI replace
- [ ] **Image paste — Phase 1 (base64)** — install `@tiptap/extension-image`; add `editorProps.handlePaste` to intercept clipboard image files, convert to base64 data URL via `FileReader`, insert as image node; acceptable short-term but bloats `Document.content` in DB
- [ ] **Image paste — Phase 2 (S3 upload)** — add `POST /api/upload` route returning a permanent URL; replace `FileReader.readAsDataURL` with a fetch to the upload endpoint; aligns with planned migration of document content storage to AWS S3

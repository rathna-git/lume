# Lume — Architecture Reference

> This document reflects the **current** system design.
> When architecture changes, update this file in the same commit.
> Log the _reason_ for the change in `PROGRESS.md`.

---

## Stack

| Layer            | Technology                         |
| ---------------- | ---------------------------------- |
| Framework        | Next.js 16, App Router, TypeScript |
| Styling          | Tailwind CSS v4, shadcn/ui         |
| Theming          | next-themes (class-based, dark default) |
| Auth             | Clerk                              |
| Database         | PostgreSQL + Prisma v6             |
| Server state     | TanStack Query v5                  |
| Validation       | Zod                                |
| Rich text editor | Tiptap v3 (ProseMirror)            |
| Motion           | Framer Motion v12                  |
| AI               | OpenAI (GPT-4o)                    |
| Package manager  | pnpm                               |

---

## Folder Structure

```
app/
├── (auth)/
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
├── (dashboard)/
│   ├── layout.tsx                  ← app shell + user bootstrap
│   ├── page.tsx                    ← redirect → /dashboard
│   ├── dashboard/
│   │   └── page.tsx                ← Home dashboard (greeting, recent pages, workspaces, quick actions; two-col layout)
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
│   │   ├── route.ts                ← GET list (includes `_count.documents` per workspace), POST create
│   │   └── [workspaceId]/route.ts  ← GET, PATCH, DELETE
│   ├── documents/
│   │   ├── route.ts                ← GET list, POST create
│   │   ├── recent/route.ts         ← GET — latest 5 docs across all user workspaces, with workspace info
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
├── providers.tsx                   ← ThemeProvider (next-themes) + TanStack Query provider + devtools
├── theme-toggle.tsx               ← sun/moon dark/light mode toggle (client)
├── landing/
│   └── parallax-hills.tsx          ← scroll-based parallax on hero hill layers (client)
├── layout/
│   └── sidebar.tsx                 ← nav IA: Home / Workspaces / Search / Templates / Settings (Search+Templates disabled); contextual workspace+doc tree (amber active state, all docs, + New page inline); user name/email + UserButton
├── workspace/
│   └── workspace-card.tsx          ← clickable card linking to workspace
└── document/
    ├── document-card.tsx           ← clickable card linking to document editor
    └── slash-command.tsx           ← slash command Tiptap extension + React dropdown menu

lib/
├── prisma.ts                       ← Prisma singleton client
├── openai.ts                       ← OpenAI singleton client
├── auth.ts                         ← requireCurrentDbUser() — Clerk → DB bridge
├── env.ts                          ← server-side env validation
├── utils.ts                        ← cn() utility (shadcn)
└── rate-limit.ts                   ← in-memory sliding window rate limiter (per-user, reusable)

hooks/
├── use-workspaces.ts               ← useWorkspaces, useCreateWorkspace, useUpdateWorkspace, useDeleteWorkspace
├── use-documents.ts                ← useDocuments, useCreateDocument, useRecentDocuments
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

| Data                       | Owner                                  | Mechanism                                                                                                                                                                                                                                               |
| -------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth session               | Clerk                                  | `auth()` server-side / `useUser()` client                                                                                                                                                                                                               |
| Current user (DB)          | Prisma User                            | Fetched server-side in layouts                                                                                                                                                                                                                          |
| Workspaces list            | TanStack Query                         | `useWorkspaces()`                                                                                                                                                                                                                                       |
| Active workspace           | TanStack Query                         | `useWorkspace(id)` — local hook defined in the workspace detail page; not in global `hooks/`; keyed `["workspace", workspaceId]`                                                                                                                        |
| Documents list             | TanStack Query                         | `useDocuments(workspaceId)`                                                                                                                                                                                                                             |
| Document content           | Local `useState`                       | Debounced auto-save via `useMutation`                                                                                                                                                                                                                   |
| AI generations (persisted) | TanStack Query                         | `useAiGenerations(documentId)` — keyed `["aiGenerations", documentId]`; `staleTime: Infinity`; invalidated after successful mutation                                                                                                                    |
| AI panel selected action   | Local `useState`                       | `selectedAction` — which action tab is active; drives what persisted result is shown                                                                                                                                                                    |
| AI panel pending action    | Local `useState`                       | `pendingAction` — in-flight action; clears on success/error; all generate buttons disabled while set                                                                                                                                                    |
| Replaced generation ID     | Local `useState`                       | `replacedGenerationId` — tracks which generation's output is currently in the editor via Replace content; drives "Revert to original" button visibility, `isAlreadyApplied` check, and `isStale` suppression; cleared on user edits or Insert at cursor |
| Pre-replace HTML snapshot  | Local `useRef`                         | `originalHtmlRef` — HTML captured at the moment "Replace content" fires; used to restore exact rich formatting on revert; cleared after revert or user edit                                                                                             |
| AI panel collapse state    | Local `useState`                       | `resultCollapsed` in `AiPanel` — collapses everything below the result section header (pending, empty state, markdown, action buttons, history); default `false` (expanded)                                                                             |
| Slash command menu         | Local `useState` in `SlashCommandMenu` | `open`, `items`, `selected`, `pos`, `commandFn` — driven by events from `SlashCommandExtension` via `onSlashEvent` callback bus                                                                                                                         |

---

## Route Map

| Route                                   | Type           | Description                                                                    |
| --------------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `/`                                     | Public page    | Landing page (unauthenticated); redirects to `/dashboard` when authenticated              |
| `/dashboard`                            | Protected page | Home dashboard — greeting, recent pages, workspaces, quick actions                       |
| `/sign-in`                              | Auth page      | Clerk sign-in                                                                  |
| `/sign-up`                              | Auth page      | Clerk sign-up                                                                  |
| `/workspaces`                           | Protected page | Workspace list                                                                 |
| `/workspaces/[id]`                      | Protected page | Workspace + document list                                                      |
| `/workspaces/[id]/documents/[id]`       | Protected page | Document editor                                                                |
| `/settings`                             | Protected page | User settings                                                                  |
| `POST /api/webhooks/clerk`              | API            | Sync Clerk user to DB _(not implemented — server-side bootstrap used instead)_ |
| `GET/POST /api/workspaces`              | API            | List / create workspaces                                                       |
| `GET/PATCH/DELETE /api/workspaces/[id]` | API            | Single workspace                                                               |
| `GET/POST /api/documents`               | API            | List (includes `content` for card previews) / create documents                 |
| `GET/PATCH/DELETE /api/documents/[id]`  | API            | Single document                                                                |
| `POST /api/ai/generate`                 | API            | AI content actions                                                             |
| `GET /api/documents/[id]/generations`   | API            | Fetch saved AI generations for a document, newest first                        |
| `GET /api/documents/recent`             | API            | Latest 5 documents across all user workspaces, ordered by `updatedAt DESC`; includes `workspace.id/name/emoji`; ownership enforced |

---

## Loading / Error / Empty States

| Screen          | Loading                                                     | Error                                                | Empty                                                                                                                           |
| --------------- | ----------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Workspace list  | Skeleton cards                                              | Inline "Something went wrong" text                   | "No workspaces yet" CTA                                                                                                         |
| Document list   | Skeleton cards                                              | Inline "Something went wrong" text                   | "No documents yet" — softened empty state; cards show content preview snippet                                                   |
| Document editor | Pulse skeleton card                                         | Inline "Document not found"                          | Placeholder "Untitled document" in title; "Type '/' for commands or start writing" + subtle AI panel helper line in editor body |
| AI generate     | "Running…" on button, disabled state; Regenerate icon spins | Error silently clears `pendingAction`                | "No {action} yet" + Generate button (disabled when doc empty)                                                                   |
| AI panel        | Animated skeleton (4 rows, action tab must be selected)     | "Couldn't load your previous results." + "Try again" | "Summarize, rewrite, or expand without leaving the editor." when no action selected; per-action empty state with Generate CTA   |

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

| Decision                                                                         | Reason                                                                                                                                                                                                                                                                                                    | Tradeoff                                                                                                                                                                                  |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API routes over Server Actions                                                   | Easier to test, reusable from hooks                                                                                                                                                                                                                                                                       | More boilerplate                                                                                                                                                                          |
| Clerk webhook for user sync                                                      | Clean separation of auth and DB                                                                                                                                                                                                                                                                           | Needs public URL in dev (ngrok)                                                                                                                                                           |
| Debounced auto-save                                                              | Better UX than manual save                                                                                                                                                                                                                                                                                | Risk of content loss on abrupt close                                                                                                                                                      |
| Prisma v6 (not v7)                                                               | Node.js 20.10 compatibility                                                                                                                                                                                                                                                                               | Miss v7 features; upgrade when Node is updated                                                                                                                                            |
| No real-time (Phase 1)                                                           | Simpler architecture                                                                                                                                                                                                                                                                                      | Two tabs editing same doc will conflict                                                                                                                                                   |
| Tags as many-to-many                                                             | Proper relational model                                                                                                                                                                                                                                                                                   | Join table adds complexity; simplify to string[] if needed                                                                                                                                |
| No `src/` directory                                                              | Flatter, cleaner root                                                                                                                                                                                                                                                                                     | Personal preference — consistent across team                                                                                                                                              |
| Hybrid CSS+HTML+SVG landing hero instead of pure SVG                             | Pure SVG with `preserveAspectRatio="xMidYMid slice"` broke on wide screens — sun scaled massively, hills got cut off. CSS gradient for sky, HTML div for sun (sized with `vh`), and SVG with `preserveAspectRatio="none"` for hills scales correctly at any viewport width                                | Three rendering layers to coordinate; sun positioning requires manual `top` percentage tuning                                                                                             |
| Use server-side user bootstrap for MVP instead of webhook-first sync             | Simplifies local development and avoids ngrok/webhook setup during early build phase                                                                                                                                                                                                                      | Webhook still required later for production-grade sync guarantees                                                                                                                         |
| Persist AI generations before building read flow                                 | Preserves outputs and avoids schema churn later                                                                                                                                                                                                                                                           | AI panel is now fully persistence-driven via `useAiGenerations`                                                                                                                           |
| Split page into shell + editor components for async data init                    | Avoids `useEffect` state seeding; state initialized directly from props at mount                                                                                                                                                                                                                          | Adds one level of component nesting                                                                                                                                                       |
| `staleTime: Infinity` on `useAiGenerations`                                      | Generations only change when the user explicitly runs a new action — no background source can mutate them                                                                                                                                                                                                 | Must ensure `invalidateQueries` is always called after successful mutation or cache will be stale                                                                                         |
| AI panel action tabs select view, not trigger generation                         | Separates navigation from side effects — user can browse results without accidentally firing API calls                                                                                                                                                                                                    | Generate/Regenerate must be a deliberate explicit action                                                                                                                                  |
| `inputSnapshot` staleness over timestamp-based staleness                         | Content drift is the relevant signal, not time; comparing snapshots directly tells us whether the result is still valid for the current document                                                                                                                                                          | Simple string equality — no diffing, no normalization; whitespace differences will mark as stale                                                                                          |
| `proxy.ts` instead of `middleware.ts`                                            | Next.js 16 deprecated the `middleware` file convention in favour of `proxy`                                                                                                                                                                                                                               | Rename required; export name also changed from `middleware` to `proxy`                                                                                                                    |
| Single `pendingAction` state gates all generate buttons                          | Prevents overlapping mutations and keeps panel state predictable                                                                                                                                                                                                                                          | Only one action can run at a time; users cannot queue multiple generations                                                                                                                |
| Tiptap content stored as HTML; plain text extracted via `textBetween` for AI     | AI needs plain text; editor needs HTML for rich formatting. `textBetween(0, size, "\n\n")` reproduces the paragraph-separated format previously stored in `inputSnapshot`, keeping staleness and revert comparisons valid                                                                                 | Old plain-text documents render correctly (Tiptap wraps in `<p>`); newly saved content is HTML                                                                                            |
| Custom `BubbleMenuReact` portal instead of Tiptap's BubbleMenu extension         | Tiptap v3 dropped the React component wrapper from `@tiptap/react`; the extension is a bare ProseMirror plugin requiring manual DOM integration. A lightweight React component using `editor.on("selectionUpdate")` + `window.getSelection()` + `createPortal` is simpler and fully sufficient            | No dependency on `@tiptap/extension-bubble-menu`; `onMouseDown` + `preventDefault` keeps selection alive when clicking menu buttons                                                       |
| `BubbleMenuReact` render prop for `flipLeft`                                     | The overflow panel needs viewport-derived positioning computed inside `BubbleMenuReact` from `rect` + `window.innerWidth`. A render prop (`children: (opts: { flipLeft }) => ReactNode`) flows this info without prop-drilling                                                                            | Overflow panel uses `position: absolute` horizontally — never clips at top or bottom; `showBelow` handles top-edge clipping for the pill                                                  |
| `marked.parse()` for AI replace/insert                                           | AI output is markdown; Tiptap needs HTML. `marked.parse()` converts the full markdown AST (headings, bold, lists, code blocks). `textToHtml` helper removed after revert was redesigned to use `originalHtmlRef`                                                                                          | `marked.parse()` used synchronously (no async extensions); cast as `string` to satisfy TypeScript                                                                                         |
| `originalHtmlRef` for revert instead of `textToHtml(inputSnapshot)`              | `inputSnapshot` is plain text (captured via `textBetween`); re-converting it to HTML strips all rich formatting. Capturing `editor.getHTML()` at the moment "Replace content" is clicked preserves the exact pre-replace state                                                                            | Ref is cleared on user edits and after revert fires; `isReplacingRef` prevents `onUpdate` from clearing it during programmatic `setContent` calls                                         |
| `replacedGenerationId` state replaces `content === outputText` for revert button | After `marked.parse()`, `textBetween` strips markdown syntax from rendered HTML so `content !== outputText` is always true — the revert button never showed. Explicit ID tracking is robust regardless of content format                                                                                  | `isReplacingRef` guards against `onUpdate` clearing the state when `setContent` fires synchronously inside `handleReplace`                                                                |
| OpenAI system message for consistent Markdown output                             | Without a system message, GPT-4o mirrors input style — plain prose input (from `textBetween` after a "Replace content") returns plain prose output. System message overrides this and ensures every generation is Markdown-formatted for `marked.parse()`                                                 | Applies to all three actions and all generations including regenerations; keeps user-facing prompts clean                                                                                 |
| `resultCollapsed` collapses the full result body, not just the markdown          | Collapsing only the markdown area would leave orphaned action buttons with no visible content above them — confusing UX. Collapsing the entire body (pending/empty/markdown/buttons/history) keeps the panel clean and predictable when minimised                                                         | The section header (label + Regenerate/Back to latest + chevron) always stays visible so the user knows which action is selected                                                          |
| `isAlreadyApplied` disables only "Replace content", not "Insert at cursor"       | Replace is a terminal state — the result IS the document, re-applying is a no-op. Insert at cursor is additive — users may want multiple insertions at different cursor positions, so it stays enabled. `isAlreadyApplied = displayed.id === replacedGenerationId`; derived inline, no new state or props | "Copy" also stays enabled; helper text below buttons explains the disabled state to users                                                                                                 |
| OpenAI timeout set to 15s                                                        | Vercel serverless functions have a max execution time; a hung OpenAI call would silently consume it. 15s is tight enough to fail fast without cutting off normal generations (~3–8s). Timeout errors surface a distinct user message ("AI took too long to respond") rather than the generic failure copy | Aggressive timeout may occasionally reject slow-but-valid responses; can be raised if needed                                                                                              |
| Slash command event bus instead of separate React root                           | Creating a `createRoot` inside a Tiptap extension render callback is fragile (async mount, separate React tree, no access to parent context). An event bus (`onSlashEvent`) lets the extension emit open/update/close signals that a normal React component subscribes to via `useEffect`                 | Global singleton callback — only one editor instance can use slash commands at a time; sufficient for single-document editing                                                             |
| `@tiptap/extension-placeholder` for empty editor hint                            | CSS-only `.is-editor-empty` placeholder was unreliable — Tiptap v3 applies the class on the `<p>` element, not `ProseMirror`. The official Placeholder extension adds `data-placeholder` attribute reliably                                                                                               | Extra dependency; CSS targets `p.is-editor-empty:first-child::before` with `content: attr(data-placeholder)`; a second React-rendered helper line below the editor uses `editor?.isEmpty` |

---

## Completed

Key milestones shipped to date:

- Next.js scaffold, brand system, landing page, Clerk auth, Prisma schema + migrations
- Workspace CRUD (create, rename, delete with cascade) + document CRUD (create, edit, delete with confirmation dialog)
- Tiptap rich text editor with autosave, bubble menu (Bold/Italic/Strike/Code + overflow panel), slash command menu (`/` to insert blocks)
- AI generation flow — Summarize / Rewrite / Expand via OpenAI GPT-4o; persisted generations with `inputSnapshot` staleness detection
- Action-driven AI panel (tabs, Generate/Regenerate, Replace/Insert at cursor/Copy, Revert to original, collapsible results, horizontal history scroll)
- Markdown rendering in AI panel (react-markdown) + `marked.parse()` for Replace/Insert
- Rate limiting (in-memory, 12 req/min) + 15s OpenAI timeout + error logging
- Document sorting by `updatedAt DESC` with relative timestamps
- Deployment to Vercel — all features verified end-to-end
- UI polish passes — editor typography, warm color palette, empty state mood pass, workspace/document three-dot menus, colored AI panel icons, toast notifications, visual depth on document cards, workspace page visual parity with editor
- Dark mode / light mode — next-themes with class-based toggling; dark default using landing page `#090E09`; sun/moon toggle on all pages; theme-aware sidebar, toasts, and semantic CSS tokens
- App shell neutral palette — light theme tokens neutralized (warm beige → white/neutral grays); dark theme unchanged; sidebar and editor card borders hardcoded to `neutral-200` to bypass CSS variable chain
- Sidebar IA + polish — Home/Workspaces/Search/Templates/Settings nav (Search+Templates disabled); contextual workspace+doc tree (amber active state, all docs, + New page inline); user name+email + UserButton at bottom; top new-doc button removed (page creation lives in the workspace tree)
- Document editor card polish — outer padding `p-6 md:p-8`, back link compact and neutral, card borders `neutral-200`, metadata `text-neutral-400`, AI panel chip buttons
- AI panel polish — action chips → full-width vertical stacked buttons with amber selected state; stale warning → info callout with `Info` icon; AI output → bordered result card (`neutral-50` bg, `rounded-xl`); bottom actions: amber filled primary (Insert at cursor), outlined secondary (Replace content), outlined tertiary (Copy); footer disclaimer text added
- Visual alignment pass — column gap raised to `gap-6 lg:gap-8`; sticky offset corrected to `lg:top-8`; all `border-border` inside AiPanel → `border-neutral-200 dark:border-border`; hover states use explicit neutral; Regenerate button radius normalized to `rounded-lg`
- AI panel sticky height fix — `lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto` added so the panel never grows taller than the viewport; action buttons and history always reachable without page scroll
- Sidebar document navigation — workspace tree now shows all documents (no cap), active doc uses explicit amber bg/text/dot, and a `+ New page` button lives inline at the bottom of the tree (wired to the existing `createDocument` mutation)
- Home dashboard + IA cleanup — `GET /api/documents/recent` added (latest 5 docs with workspace info); `(dashboard)/dashboard/page.tsx` is the Home route at `/dashboard`; sidebar "Documents" nav removed, replaced with "Home" → `/dashboard`; `(dashboard)/page.tsx` is now a redirect; top new-doc button removed
- Home dashboard polish — two-column layout (`max-w-5xl`), greeting subtitle, stats row (workspace + page counts from already-fetched data), recent pages in white bordered card with divider rows and skeleton loaders, workspaces as stacked cards with `_count.documents` page count, "New page in [emoji] [name]" quick action labeling; workspaces API updated to return `_count: { documents: true }`
- Motion polish — Framer Motion v12 entrance animation on Home dashboard (stagger + expo-out, `useReducedMotion` respected); hover transitions on recent page rows, workspace cards, quick action buttons; sidebar nav `duration-150` transitions; superseded CSS animation classes removed from `globals.css`

---

## Remaining for V1 Release

### Public-facing / product presentation

- [x] **Landing page reflects what Lume actually is now** — hero redesigned with Oura-inspired landscape scene (gradient sky, sun, hills) + entrance animations; DM Sans light headline matching app UI font; unified hero content block with product subheadline and "Start writing" CTA; responsive positioning for mobile/desktop; feature section with "Built for writing" intro, product-specific card copy, and spaced card layout
- [x] **Workspace page no longer feels weaker than editor page** — visual polish pass: tinted document cards, outline CTA, document count, header separator, tighter layout, softer empty state, quieter menu
- [x] **Sidebar feels intentional and complete** — full nav IA (Workspaces / Documents / Search / Templates / Settings), new-doc button with amber accent, contextual workspace+doc tree, user name+email at bottom; disabled items use neutral-400 instead of warm/opaque colors; white bg and neutral-200 borders hardcoded to bypass CSS variable chain
- [ ] **Product copy is consistent across the app** — align wording across landing page, workspace page, editor empty states, and AI panel so the product speaks in one voice

### Product behavior

- [ ] **Better new-document flow (v1 simple safeguard)** — keep the current immediate-create architecture, but prevent junk empty documents from accumulating; ship a simple v1 safeguard before launch
- [ ] **AI actions on empty docs are handled clearly** — ensure empty-document behavior is obvious and non-confusing; users should understand when AI actions are unavailable or need draft content first
- [ ] **Strengthen separator between title/metadata and document body** — the current divider is still too subtle; give the writing area a clearer visual anchor if this remains unresolved

### Trust / release confidence

- [ ] **Quick smoke test in production after latest changes** — verify the latest editor, shell, and empty-state changes end-to-end in the deployed app
- [ ] **One clean demo path for launch / sharing** — define a frictionless walkthrough that reliably shows the core Lume experience for public launch, interviews, and feedback sharing

No other major functional gaps remain for a v1 release. The core writing + AI workflow is complete.

---

## Post-V1 / V1.1

- [ ] **Better new-document flow (v1.1 true draft mode)** — "New Document" opens an unsaved draft editor first; a real `Document` record is only created on first meaningful save (title or content). Preferred long-term flow, but not required if the v1 safeguard ships first
- [ ] Add filtering / sorting for AI generations
- [ ] Define retention / versioning strategy for AI outputs
- [ ] Harden Clerk webhook sync flow post-MVP
- [ ] **Rate limiting v2** — replace in-memory limiter with a distributed solution (e.g. Upstash Redis) so the limit is enforced globally across all Vercel instances
- [ ] **Image paste — Phase 1 (base64)** — install `@tiptap/extension-image`; `handlePaste` to intercept clipboard images, convert to base64 data URL, insert as image node; short-term solution that bloats `Document.content`

---

## Longer-Term / V2+

- [ ] **Version history** — full document timeline across edits; browse and restore any prior state, not just the last AI replace
- [ ] **Image paste — Phase 2 (S3 upload)** — `POST /api/upload` route returning a permanent URL; replaces base64 approach
- [ ] **Migrate document content storage to AWS S3** — store content as files in S3, save URL in the `Document` table instead of raw text; improves scalability for large documents

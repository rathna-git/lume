# Inbox-First + Smart Workspace Assignment — Revised Phased Plan

> Product principle: "Write first. Lume helps organize later."
> Each phase is a small, independently shippable commit or PR. Later phases do not block earlier ones.

---

## Phase 0 — Documentation / Final Decisions

**Goal:** Lock in product decisions in writing before any code changes.

### Files affected
- `ARCHITECTURE.md`
- `PROGRESS.md`
- `IMPLEMENTATION_PLAN.md` (this file)

### Tasks
- [ ] Update `ARCHITECTURE.md` — confirm the following are finalized:
  - Inbox = `workspaceId: null`; internal model stays `Document`, UI says "Page"
  - `Document.userId` is the canonical ownership field
  - General `PATCH /api/documents/[id]` does NOT accept `workspaceId`; move requires a dedicated route
  - AI suggestion API fetches content server-side; client sends `{ documentId, force? }`
  - Suggestion dismissal fields live on `Document` (not a separate model) for V1
  - Auto-trigger rules: Inbox only, ≥ 300 chars plain text, 5s pause, no re-trigger on same hash, no re-trigger after dismiss unless `force`
  - Workspace deletion / Trash is a separate later phase (Phase 7) — does not block Inbox work
- [ ] Add a `## Trash (Phase 7 — not yet implemented)` section to `ARCHITECTURE.md` listing the schema, API, and UI needs without implementing them
- [ ] Update `PROGRESS.md` with a new dated entry noting Phase 0 documentation pass

### Risks
- None — no code changes

### What to test
- Read-through only; ensure docs match product decisions

### Must NOT include
- Any schema, migration, or API change

---

## Phase 1 — Database Foundation

**Goal:** Extend the Prisma schema to support Inbox ownership and suggestion persistence. No API behavior changes yet.

### Files affected
- `prisma/schema.prisma`
- `prisma/migrations/[timestamp]_inbox_foundation/migration.sql` (new)
- `PROGRESS.md`

### Tasks

#### Schema changes — `Document` model
- [ ] Add `userId String` (non-null after backfill)
- [ ] Add `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`
- [ ] Change `workspaceId String` → `workspaceId String?`
- [ ] Change `workspace Workspace @relation(...)` → `workspace Workspace? @relation(...)`
- [ ] Keep `onDelete: Cascade` on the workspace relation — do NOT switch to `SetNull` (Trash phase will handle soft-delete; `SetNull` would silently move pages to Inbox on workspace hard-delete, which is not the intended behavior)
- [ ] Add `deletedAt DateTime?` — soft-delete scaffold for Trash (Phase 7); no business logic yet, just the field
- [ ] Add suggestion persistence fields:
  - `workspaceSuggestionDismissedAt DateTime?`
  - `workspaceSuggestionLastTriggeredAt DateTime?`
  - `workspaceSuggestionContentHash String?`
  - `workspaceSuggestionWorkspaceId String?`
  - `workspaceSuggestionReason String?`
  - `workspaceSuggestionConfidence String?`
- [ ] Add indexes: `@@index([userId])`, `@@index([userId, workspaceId])`; keep `@@index([workspaceId])`

#### Schema changes — `User` model
- [ ] Add `documents Document[]` relation

#### Migration strategy
- [ ] Run `pnpm prisma migrate dev --create-only --name inbox_foundation` to generate initial SQL
- [ ] Edit the generated SQL to make the backfill safe:
  1. `ALTER TABLE "Document" ADD COLUMN "userId" TEXT;` (nullable first)
  2. `UPDATE "Document" d SET "userId" = w."userId" FROM "Workspace" w WHERE d."workspaceId" = w.id;` (backfill)
  3. Check for orphaned documents before step 3: `SELECT COUNT(*) FROM "Document" d LEFT JOIN "Workspace" w ON d."workspaceId" = w.id WHERE w.id IS NULL;` — if count > 0, stop and report
  4. `ALTER TABLE "Document" ALTER COLUMN "userId" SET NOT NULL;`
  5. `ALTER TABLE "Document" ALTER COLUMN "workspaceId" DROP NOT NULL;`
  6. Add FK for `userId`
  7. Add suggestion fields (all nullable, no default needed)
  8. Add `deletedAt` to `Document`
  9. Add new indexes
- [ ] Run `pnpm prisma migrate dev` to apply
- [ ] Run `pnpm prisma generate`

#### Compile fixes only (no behavior changes)
- [ ] Fix any TypeScript errors from `workspaceId` becoming `string | null` in Prisma-generated types
- [ ] These fixes should be null-safe guards, not logic changes (e.g., `doc.workspaceId ?? ""` where a string is required for an existing function)
- [ ] Update `DocumentDetail` interface in `hooks/use-document.ts` to include `workspaceId: string | null` (needed in later phases)

### Risks
- Backfill fails if orphaned documents exist (workspace deleted without cascading documents) — mitigation: run orphan check query before migration
- Neon cloud DB: test migration on a branch DB or local shadow DB first
- `onDelete: Cascade` kept intentionally — if a workspace is hard-deleted at DB level (not via API), its documents are also hard-deleted. This is acceptable until Trash is implemented. The API will use soft-delete in Phase 7.

### What to test
- `pnpm prisma generate` succeeds with no errors
- TypeScript compiles without errors (`pnpm tsc --noEmit`)
- Existing app still works end-to-end (document create/edit/delete, workspace CRUD) — no behavioral change expected

### Must NOT include
- Any API route changes
- Any UI changes
- Any query updates (filtering by `deletedAt`, `userId`, etc.)

---

## Phase 2 — Document APIs + Ownership

**Goal:** Update all document API routes to use direct `userId` ownership, support Inbox semantics, and add the move route. No UI changes.

### Files affected
- `app/api/documents/route.ts`
- `app/api/documents/[documentId]/route.ts`
- `app/api/documents/recent/route.ts`
- `app/api/documents/[documentId]/move/route.ts` (new file)
- `app/api/ai/generate/route.ts` (ownership check update only)
- `app/api/workspaces/route.ts` (add `deletedAt: null` filter — see note)
- `hooks/use-documents.ts`
- `hooks/use-document.ts`
- `PROGRESS.md`

### Tasks

#### `GET /api/documents` — unified listing
- [ ] Remove requirement for `workspaceId` query param
- [ ] Support three cases:
  - No params → all documents where `userId = currentUser.id`
  - `?workspaceId=abc` → documents in that workspace; verify workspace ownership
  - `?scope=inbox` → documents where `userId = currentUser.id AND workspaceId IS NULL`
- [ ] All queries must filter `deletedAt: null`
- [ ] Ownership check: `document.userId = currentUser.id` (not workspace join)

#### `POST /api/documents` — create document
- [ ] Make `workspaceId` optional in Zod schema (`z.string().optional()`)
- [ ] If `workspaceId` provided: verify workspace belongs to user, set `workspaceId`
- [ ] If `workspaceId` absent/null: create Inbox page, `workspaceId: null`
- [ ] Always set `userId: currentDbUser.id`

#### `GET /api/documents/[documentId]` — fetch document
- [ ] Replace `getOwnedDocument` helper: use `document.userId = currentUser.id` directly (remove workspace join)
- [ ] Include `workspaceId` in select (needed by editor in Phase 3+)

#### `PATCH /api/documents/[documentId]` — update document
- [ ] Update ownership check to use `userId` directly
- [ ] Explicitly reject any `workspaceId` field in the body (400 error with message: "Use the move route to change workspace")
- [ ] Only allow `title`, `content` updates

#### `DELETE /api/documents/[documentId]`
- [ ] Update ownership check to use `userId` directly
- [ ] Keep existing hard-delete behavior
- [ ] Add `// TODO Phase 7: replace with soft-delete (Trash)` comment

#### `GET /api/documents/recent`
- [ ] Switch to `userId = currentUser.id` filter (remove workspace join)
- [ ] Include Inbox docs (`workspaceId` may be null)
- [ ] Return `workspace: { id, name, emoji } | null` — null for Inbox pages

#### NEW: `PATCH /api/documents/[documentId]/move`
- [ ] Body: `{ workspaceId: string | null }`
- [ ] Auth via `requireCurrentDbUser()`
- [ ] Fetch document; verify `document.userId = currentUser.id`
- [ ] If `workspaceId` is a string: verify target workspace belongs to user
- [ ] If `workspaceId` is null: move to Inbox
- [ ] After successful move, clear suggestion fields: `workspaceSuggestionWorkspaceId`, `workspaceSuggestionReason`, `workspaceSuggestionConfidence`, `workspaceSuggestionContentHash` (preserve `DismissedAt` — cleared separately)
- [ ] Return updated document with workspace info

#### `POST /api/ai/generate` — ownership check only
- [ ] Update `prisma.document.findFirst` ownership check from `workspace: { userId }` to `userId: user.id`
- [ ] No other changes to this route

#### `GET /api/workspaces` — filter soft-deleted
- [ ] Add `deletedAt: null` to workspace `where` clause (even though Phase 7 hasn't implemented soft-delete yet, this future-proofs the query; currently all `deletedAt` values are null so behavior is unchanged)
- [ ] Update `_count: { select: { documents: { where: { deletedAt: null } } } }` to exclude soft-deleted docs from counts

#### Hooks — `hooks/use-documents.ts`
- [ ] Update `CreateDocumentInput`: `workspaceId?: string | null`
- [ ] Update `useCreateDocument` `onSuccess` cache invalidation:
  - If `workspaceId` provided: invalidate `["documents", workspaceId]`
  - Always invalidate `["documents", "recent"]`
  - Always invalidate `["documents", "inbox"]` (new key — for future use)
- [ ] Update `RecentDocument` type: `workspace: { id, name, emoji } | null`
- [ ] Add `useMoveDocument()` mutation:
  - Calls `PATCH /api/documents/[id]/move`
  - `onSuccess`: invalidate `["document", docId]`, `["documents", "recent"]`, `["documents", "inbox"]`, `["documents", workspaceId]` (both old and new workspace if available), `["workspaces"]`
- [ ] Add `useInboxDocuments()`: calls `GET /api/documents?scope=inbox`, key `["documents", "inbox"]`

#### Hooks — `hooks/use-document.ts`
- [ ] Confirm `DocumentDetail` includes `workspaceId: string | null` (added in Phase 1 compile fixes)
- [ ] Update `useUpdateDocument` to NOT send `workspaceId` in body

### Risks
- Changing `GET /api/documents` to return all user docs (no workspaceId required) is a semantic change — ensure no client code relies on the old "workspaceId required" 400 error
- `useCreateDocument` onSuccess invalidation: if `workspaceId` is null (Inbox create), `documentsKey(workspaceId)` would be called with null — must guard this
- Dashboard `NewPageDialog` still passes a `workspaceId` to `createDocument` — this continues to work unchanged in this phase (Phase 4 changes the dashboard behavior)

### What to test
- Create workspace document → still works, `workspaceId` set
- Fetch/edit/delete existing documents → works with userId check
- `GET /api/documents?scope=inbox` → returns empty (no Inbox docs yet)
- `GET /api/documents/recent` → still returns workspace documents correctly; `workspace` field is non-null for all
- `PATCH /api/documents/[id]/move` → moving to a workspace sets `workspaceId`; moving to null sets Inbox
- TypeScript compiles cleanly

### Must NOT include
- Any UI changes (no dashboard, sidebar, or editor changes)
- Inbox page or Inbox nav item
- Canonical `/pages/[documentId]` route

---

## Phase 3 — Canonical Editor Route

**Goal:** Add `/pages/[documentId]` as the primary editor URL. Redirect old workspace-scoped route. Update all links.

### Files affected
- `app/(dashboard)/pages/[documentId]/page.tsx` (new)
- `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` (redirect)
- `app/(dashboard)/workspaces/[workspaceId]/page.tsx` (doc card links)
- `components/layout/sidebar.tsx` (doc links in workspace tree)
- `components/document/document-card.tsx` (link href)
- `app/(dashboard)/dashboard/page.tsx` (recent pages links)
- `PROGRESS.md`

### Tasks
- [ ] Create `app/(dashboard)/pages/[documentId]/page.tsx`:
  - Server component that checks auth (redirects to `/sign-in` if not authed)
  - Renders the existing `DocumentEditor` client component (extract it from the old page if not already extracted)
  - Does NOT require `workspaceId` param
  - Breadcrumb shows `Home / Inbox / <title>` when `workspaceId` is null, `Home / <WorkspaceName> / <title>` when set
- [ ] Convert `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` to a redirect:
  - `import { redirect } from "next/navigation"` (server component)
  - `redirect(\`/pages/\${params.documentId}\`)`
- [ ] Update document card link in `components/document/document-card.tsx`: `href={/pages/${doc.id}}`
- [ ] Update recent pages links in `app/(dashboard)/dashboard/page.tsx`: `href={/pages/${doc.id}}`
- [ ] Update workspace tree links in `components/layout/sidebar.tsx`: `href={/pages/${doc.id}}`
- [ ] Update post-create navigation in:
  - `app/(dashboard)/workspaces/[workspaceId]/page.tsx` `handleNewDocument`
  - `components/layout/sidebar.tsx` `handleNewDocument`
  - `app/(dashboard)/dashboard/page.tsx` `NewPageDialog` `handleSelect`

### Risks
- Extracting `DocumentEditor` from the old page: it's currently an inner function in the same file. Extracting it to a shared location ensures both old (redirect) and new pages can use it. Alternatively the redirect is clean enough that no extraction is needed.
- The redirect must be a server component (uses `redirect` from `next/navigation`). The old page is currently `"use client"` — need to split into a server wrapper + client component.
- Breadcrumb requires fetching workspace name when `workspaceId` is set. This is a server-side fetch or a client-side `useWorkspace(workspaceId)` call.

### What to test
- Navigate to an old `/workspaces/[id]/documents/[id]` URL → redirects to `/pages/[id]`
- All recent page links go to `/pages/[id]`
- Workspace document cards link to `/pages/[id]`
- Sidebar doc links point to `/pages/[id]`
- Breadcrumb shows correct path for workspace docs
- Editor functionality unchanged (autosave, AI panel, delete)

### Must NOT include
- Inbox UI (no "Currently in Inbox" banner yet — that's Phase 4)
- Any AI suggestion card

---

## Phase 4 — Inbox UI

**Goal:** Make "New page" from Home create an Inbox page. Add Inbox nav item, Inbox page, and correct "Inbox" labels in Recent pages. No AI suggestion yet.

### Files affected
- `app/(dashboard)/dashboard/page.tsx`
- `components/layout/sidebar.tsx`
- `app/(dashboard)/inbox/page.tsx` (new)
- `PROGRESS.md`

### Tasks

#### Home dashboard — remove workspace picker for "New page"
- [ ] Replace `NewPageDialog` (workspace picker) with direct `createDocument({ workspaceId: undefined })`
- [ ] On success, navigate to `/pages/[doc.id]`
- [ ] Remove `NewPageDialog` component (or keep for workspace-context creates if needed elsewhere)

#### Recent pages — "Inbox" label
- [ ] When `doc.workspace` is null, show "Inbox" as the workspace label (with a neutral inbox icon instead of emoji)
- [ ] When `doc.workspace` is set, show workspace emoji + name as before
- [ ] Update link: already done in Phase 3 (`/pages/[id]`)

#### Inbox nav item — sidebar
- [ ] Add "Inbox" nav item below "Home" in `components/layout/sidebar.tsx`
- [ ] Link to `/inbox`
- [ ] Active state when `pathname === "/inbox"` or `pathname.startsWith("/inbox")`
- [ ] Show badge with Inbox doc count (optional — use `useInboxDocuments()` from Phase 2)

#### Inbox page — `app/(dashboard)/inbox/page.tsx`
- [ ] List all Inbox documents (calls `GET /api/documents?scope=inbox` via `useInboxDocuments()`)
- [ ] Empty state: "No unorganized pages. When you create a page from Home, it appears here."
- [ ] Each page links to `/pages/[id]`
- [ ] No organization UI yet (Phase 5)
- [ ] Style consistent with workspace detail page

#### "Currently in Inbox" indicator — canonical editor
- [ ] In `app/(dashboard)/pages/[documentId]/page.tsx`, when `document.workspaceId === null`, show a small muted indicator in the header ("In Inbox")
- [ ] No action button yet — just the label

### Risks
- Dashboard "New page" creates Inbox doc → navigates to `/pages/[id]` with no workspace. Breadcrumb will show "Inbox". Ensure this path is smooth.
- Inbox count in sidebar badge requires `useInboxDocuments()` which fires a query on every page load. Keep it lightweight (no staleTime: 0).

### What to test
- "New page" from Home creates an Inbox doc (no workspace picker shown)
- Inbox nav item appears and links to `/inbox`
- Inbox page lists docs with `workspaceId: null`
- Recent pages shows "Inbox" label for Inbox docs
- Workspace-created pages still appear with workspace label
- "In Inbox" label appears in editor for Inbox docs

### Must NOT include
- Move to workspace / Choose workspace UI (Phase 5)
- AI suggestion card (Phase 6)
- Bulk move (Phase 5)

---

## Phase 5 — Manual Organization UI

**Goal:** Allow users to manually move Inbox pages to a workspace (or back to Inbox). Includes "Move to workspace", "Choose workspace", "Keep in Inbox" (with DB persistence). Bulk move if still reasonable in scope.

### Files affected
- `components/documents/workspace-suggestion-card.tsx` (new — used for both manual and AI org)
- `app/(dashboard)/pages/[documentId]/page.tsx` (wire in organization UI)
- `app/(dashboard)/inbox/page.tsx` (bulk move, optional)
- `hooks/use-documents.ts` (useMoveDocument already added in Phase 2)
- `PROGRESS.md`

### Tasks

#### WorkspaceSuggestionCard component (manual mode)
- [ ] Create `components/documents/workspace-suggestion-card.tsx`
- [ ] For Phase 5 (no AI suggestion yet), show a simple "Organize this page" panel:
  - "Choose workspace" button → opens workspace picker modal
  - "Keep in Inbox" button → calls PATCH to persist `workspaceSuggestionDismissedAt`, hides the card
- [ ] Card shows when: `document.workspaceId === null` AND `workspaceSuggestionDismissedAt === null`
- [ ] Phase 6 will add the AI-suggested workspace row to this same card

#### Workspace picker modal
- [ ] Reusable modal: list of user's workspaces; clicking one calls `useMoveDocument(docId, ws.id)`
- [ ] On success: update breadcrumb, hide organization card, show success toast

#### "Keep in Inbox" persistence
- [ ] Add API endpoint or update PATCH route to persist `workspaceSuggestionDismissedAt`
- [ ] Alternatively: move route accepts `{ workspaceId: null }` which already moves to Inbox — the dismiss is a separate field update. Add `PATCH /api/documents/[documentId]/dismiss-suggestion` or add it to the move route's clear logic
- [ ] Simplest: add `workspaceSuggestionDismissedAt` to the general PATCH (only this field, no workspaceId) — or use a dedicated dismiss endpoint

#### Bulk move from Inbox page (optional, descope if risky)
- [ ] Add checkbox multi-select to Inbox page
- [ ] "Move selected" button → workspace picker
- [ ] Only include if it's low-risk and the Inbox page list already renders cleanly

### Risks
- "Keep in Inbox" dismiss persistence: the field is on Document (added in Phase 1). The PATCH route currently only accepts `title`/`content`. Need a clean way to update dismiss field without opening up arbitrary field updates. A dedicated `POST /api/documents/[id]/dismiss-suggestion` endpoint is cleanest.
- Bulk move adds significant UI complexity — descope to a follow-up if needed.

### What to test
- Inbox page → "Choose workspace" → pick a workspace → page moves to workspace, breadcrumb updates, card disappears
- Inbox page → "Keep in Inbox" → card dismissed, persisted to DB, stays dismissed on page reload
- Move back to Inbox: `useMoveDocument(docId, null)` → page returns to Inbox

### Must NOT include
- AI-generated workspace suggestion (Phase 6)
- Auto-trigger logic (Phase 6)

---

## Phase 6 — Smart Workspace Assignment

**Goal:** Implement the AI suggestion backend, auto-trigger hook, and surface the suggestion in the existing WorkspaceSuggestionCard.

### Files affected
- `app/api/ai/suggest-workspace/route.ts` (new)
- `hooks/use-workspace-suggestion.ts` (new)
- `components/documents/workspace-suggestion-card.tsx` (update to show AI suggestion)
- `app/(dashboard)/pages/[documentId]/page.tsx` (wire suggestion hook)
- `PROGRESS.md`

### Tasks

#### `POST /api/ai/suggest-workspace`
- [ ] Input: `{ documentId: string, force?: boolean }`
- [ ] Auth: `requireCurrentDbUser()`
- [ ] Fetch document by `documentId`; verify `document.userId === currentUser.id`
- [ ] Verify `document.workspaceId === null` unless `force === true`
- [ ] If `!force` and `workspaceSuggestionDismissedAt` is set → return `{ dismissed: true }` without calling OpenAI
- [ ] Fetch document `content` from DB
- [ ] Strip HTML tags to extract plain text server-side (simple regex `content.replace(/<[^>]*>/g, " ").trim()`)
- [ ] If plain text length < 300 chars → return `{ tooShort: true }` without calling OpenAI
- [ ] Compute content hash (first 100 chars + total length as a string key)
- [ ] If `!force` and `workspaceSuggestionContentHash === currentHash` → return cached suggestion fields from Document (no new OpenAI call)
- [ ] Fetch user's workspaces; if none → return `{ noWorkspaces: true }`
- [ ] Call GPT-4o with structured prompt: workspace list (id, name, description) + document content → returns `{ suggestedWorkspaceId, workspaceName, confidence: "high" | "low", reason: string }`
- [ ] Persist suggestion on Document: `workspaceSuggestionLastTriggeredAt`, `workspaceSuggestionContentHash`, `workspaceSuggestionWorkspaceId`, `workspaceSuggestionReason`, `workspaceSuggestionConfidence`
- [ ] Return the suggestion JSON

#### `hooks/use-workspace-suggestion.ts`
- [ ] `useWorkspaceSuggestion(documentId, plainTextLength, isInbox)`
- [ ] `enabled` condition: `isInbox && plainTextLength >= 300`
- [ ] Content-hash debounce: 5-second `setTimeout` after last content change flips `ready` state to true; resets on each keystroke
- [ ] `staleTime: Infinity` — once fetched for a content hash, don't refetch on focus
- [ ] Query key: `["workspace-suggestion", documentId]`
- [ ] Manual refresh: expose `refetch` for "Organize with AI" button (sets `force: true`)

#### WorkspaceSuggestionCard — update for AI suggestion
- [ ] When suggestion is loaded (`suggestedWorkspaceId` non-null), show:
  - Workspace name + emoji
  - One-sentence AI reason
  - "Move to [workspace]" button (primary)
  - "Choose workspace" button (secondary)
  - "Keep in Inbox" button (tertiary / dismiss)
- [ ] When suggestion is loading, show a subtle skeleton state
- [ ] When `tooShort: true` or `noWorkspaces: true`, hide card or show a "Organize manually" prompt only
- [ ] Add `force` trigger: "Organize with AI" button (shown after dismissal) clears `DismissedAt` via API and refetches with `force: true`

#### Auto-trigger rules (document in `// TODO` comments if not wired yet)
- [ ] Only triggers when `document.workspaceId === null`
- [ ] Only after ≥ 300 chars plain text
- [ ] Only after 5s of no typing
- [ ] Does not re-trigger if content hash unchanged since last suggestion
- [ ] Does not re-trigger after dismissal unless `force: true`

### Risks
- Content hash computed on both server (for DB storage) and client (for cache key). Keep logic identical in both places (first 100 chars + total length).
- `staleTime: Infinity` means the suggestion doesn't update if the user keeps writing beyond 300 chars. Only re-triggers when content hash changes (new hash → new query key → new fetch).
- Rate: one OpenAI call per content-hash cross per document. Budget impact is low at V1 scale.
- The 5s debounce must reset on every keystroke — use a `useEffect` with a `clearTimeout` cleanup.

### What to test
- Write < 300 chars in Inbox page → no suggestion triggered
- Write ≥ 300 chars, pause 5s → suggestion card appears with AI workspace recommendation
- "Move to [workspace]" → page moves, card disappears
- "Keep in Inbox" → card dismissed, survives page reload
- "Organize with AI" after dismiss → refetches with force, new suggestion shown
- Writing more content (new hash) → re-triggers after 5s pause
- Workspace-created page → suggestion never triggers

### Must NOT include
- Trash / soft-delete (Phase 7)
- Bulk AI auto-organize (V2)

---

## Phase 7 — Trash / Soft Delete

**Goal:** Implement soft-delete infrastructure, Trash page, and update workspace deletion to send pages to Trash instead of permanently deleting them.

### Files affected
- `prisma/schema.prisma` (soft-delete fields already added in Phase 1 as `deletedAt`)
- `app/api/workspaces/[workspaceId]/route.ts` (DELETE → soft-delete)
- `app/api/documents/[documentId]/route.ts` (DELETE → soft-delete)
- `app/(dashboard)/trash/page.tsx` (new)
- `components/layout/sidebar.tsx` (enable Trash nav item)
- `app/(dashboard)/workspaces/[workspaceId]/page.tsx` (update delete dialog text)
- Optional: cron/scheduled job for 30-day permanent cleanup
- `PROGRESS.md`

### Tasks

#### Schema (if not already done in Phase 1)
- [ ] Confirm `Document.deletedAt DateTime?` exists (added in Phase 1)
- [ ] Add `Workspace.deletedAt DateTime?` if not already present

#### Workspace soft-delete
- [ ] Change `DELETE /api/workspaces/[id]` to soft-delete:
  - `prisma.workspace.update({ data: { deletedAt: new Date() } })`
  - Soft-delete all documents in that workspace: `prisma.document.updateMany({ where: { workspaceId }, data: { deletedAt: new Date() } })`
- [ ] Add `deletedAt: null` filter to all workspace queries (GET list, GET detail, workspace tree in sidebar)
- [ ] Change `onDelete: Cascade` on `Document.workspace` FK to `onDelete: SetNull` OR keep Cascade but rely on soft-delete at API layer — document the decision
- [ ] Update workspace detail delete dialog text: "This workspace and its pages will be moved to Trash."

#### Document soft-delete
- [ ] Change `DELETE /api/documents/[id]` to soft-delete:
  - `prisma.document.update({ data: { deletedAt: new Date() } })`
- [ ] Add `deletedAt: null` filter to ALL document queries:
  - `GET /api/documents` (all three variants)
  - `GET /api/documents/[id]`
  - `GET /api/documents/recent`
  - Workspace document counts in `GET /api/workspaces`

#### Trash page — `app/(dashboard)/trash/page.tsx`
- [ ] List all documents where `deletedAt IS NOT NULL` for the current user
- [ ] Show delete date; highlight docs deleted > 25 days ago (approaching permanent deletion)
- [ ] "Restore" action: clear `deletedAt`, move back to original `workspaceId` (or Inbox if workspace also deleted)
- [ ] "Delete permanently" action: hard delete

#### Sidebar — enable Trash nav item
- [ ] Replace the `<span>` placeholder for Trash with a real `<Link href="/trash">`

#### 30-day cleanup
- [ ] Document the cleanup approach: a Vercel Cron job or a nightly scheduled function that runs `prisma.document.deleteMany({ where: { deletedAt: { lte: thirtyDaysAgo } } })`
- [ ] Implement if Vercel Cron is available in the project; otherwise document as a TODO

### Risks
- Changing `onDelete: Cascade` to `onDelete: SetNull` requires a migration (FK constraint change). Keep Cascade if relying entirely on API-level soft-delete.
- All document queries must add `deletedAt: null` — missing one causes soft-deleted docs to reappear. Audit every `prisma.document.findMany`/`findFirst` call.
- Restore logic: if the workspace was also soft-deleted, restoring a document to that workspace would cause the document to appear in a non-existent workspace. Solution: if workspace is deleted, restore to Inbox (`workspaceId: null`).

### What to test
- Delete workspace → workspace disappears from list; documents appear in Trash
- Delete individual document → appears in Trash, not in workspace
- Restore document → reappears in original workspace (or Inbox if workspace deleted)
- All document lists exclude soft-deleted docs
- 30 days later (simulate by backdating `deletedAt`): permanent cleanup runs correctly

### Must NOT include
- Bulk Trash operations (V2)
- Workspace restore (V2 — just document restore for now)

---

## Summary Table

| Phase | What ships | Blocks anything? |
|---|---|---|
| 0 | Docs only | Nothing |
| 1 | Schema + migration | Phases 2–7 all depend on this |
| 2 | APIs + ownership | Phase 3 depends on `workspaceId` nullable in API |
| 3 | Canonical route + redirects | Phase 4 depends on `/pages/[id]` |
| 4 | Inbox UI | Phase 5 depends on Inbox nav + page |
| 5 | Manual org UI | Phase 6 adds AI to the same card |
| 6 | AI suggestion | Independent after Phase 5 |
| 7 | Trash / soft-delete | Independent after Phase 2 |

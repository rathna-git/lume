# Lume — Build Progress

> **Architecture reference:** [ARCHITECTURE.md](./ARCHITECTURE.md) — full system design, route map, data models, and tradeoffs.

---

## 2026-03-30

### Polish — Back to Workspace Link

- Moved "Back to workspace" link outside the white editor card — now sits above the card on the `#FFFEF9` page background, separating navigation from document content
- Swapped `ArrowLeft` icon for `ChevronLeft` for a cleaner chevron style
- Bumped from `text-xs` to `text-sm font-medium` for more visual weight
- Same treatment applied to the error state ("Document not found") back link

### Files Modified

| File | Notes |
| ---- | ----- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | `ChevronLeft` replaces `ArrowLeft`; link moved outside card wrapper; `justify-end` on save/menu row; extra `max-w-[1400px]` wrapper div |

---

## 2026-03-27

### Polish — Colored Icons on AI Panel Buttons

- Action tab icons now have distinct colors: Summarize (amber), Rewrite (teal), Expand (violet) — matches document card accent palette
- Apply buttons get colored icons too: Replace content (`Replace`, amber), Insert at cursor (`TextCursorInput`, teal), Copy (`ClipboardCopy`, violet), Revert (`RotateCcw`, rose)
- Button text/backgrounds stay neutral for a calm feel; icons add personality and scannability

### Files Modified

| File | Notes |
| ---- | ----- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Colored `className` on `ACTION_ICON` entries; `Replace`, `TextCursorInput`, `ClipboardCopy`, `RotateCcw` icons added to apply buttons |

---

### Polish — Document Editor Three-Dot Menu

- Replaced bare "Delete" text button with a `MoreHorizontal` three-dot menu (always visible, top-right)
- Dropdown contains "Delete" item with `Trash2` icon, styled in `text-destructive`
- Same pattern as workspace page: fixed inset overlay for outside-click dismiss
- Future-ready: Share and Import actions can be added to this menu

### Files Modified

| File | Notes |
| ---- | ----- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | `docMenuOpen` state; three-dot dropdown replacing bare Delete button; `Trash2` icon added to imports |

---

### Fix — React 19 Read-Only Ref Assignments

- React 19's `useRef` returns `RefObject` with read-only `.current` — direct assignments in the render body (`ref.current = value`) now error
- Wrapped all `ref.current` assignments in `useEffect` callbacks: `onHideRef`, `titleRef`, `saveRef`
- Converted `save` function to `useCallback` to stabilize it as a `useEffect` dependency

### Files Modified

| File | Notes |
| ---- | ----- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | `useCallback` for `save`; `useEffect` wrappers for ref assignments |

---

## 2026-03-26

### Polish — Color Refinement & Header Removal

- Removed the empty `Header` component entirely — it was a blank 56px bar with no content; deleted file and removed from layout
- Sidebar color set to `#FFFBE8` — a warm, muted butter yellow; distinct from the warm ivory background while staying calm
- Document page background set to `#FFFEF9` — near-white with a faint warm tint, lighter than the AI panel
- AI panel background set to `#FFFCEE` — sits between sidebar and page background in warmth, creating a subtle 3-level surface hierarchy
- Fixed Tiptap SSR hydration warning by adding `immediatelyRender: false` to `useEditor`

### Files Modified

| File | Notes |
| ---- | ----- |
| `app/(dashboard)/layout.tsx` | Removed `<Header />` and import |
| `components/layout/header.tsx` | Deleted |
| `app/globals.css` | `--sidebar` updated to `#FFFBE8` |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Page bg `#FFFEF9`; AI panel bg `#FFFCEE`; `immediatelyRender: false` on `useEditor` |

---

### Polish — Workspace & Document Card Visual Depth Pass

- `<main>` background set to `bg-white` — creates clear surface hierarchy: warm ivory sidebar/header vs white content area
- Document cards cycle through 4 calm accent colors (amber, teal, violet, rose) via `accentIndex` prop — left border + matching hover tint + colored hover shadow per card; color derived from sorted position
- Warm brown-tinted base shadow (`rgba(107,79,58,0.10)`) lifts cards off the white surface; hover shadow deepens with per-accent color via `onMouseEnter/Leave`
- `DocumentCard` accepts `accentIndex?: number`; `CARD_ACCENTS` array defines all four color combinations as static strings (safe for Tailwind purge)
- Workspace page passes `i` from `.map()` as `accentIndex`

### Files Modified

| File | Notes |
| ---- | ----- |
| `app/(dashboard)/layout.tsx` | `<main>` background changed to `bg-white` |
| `components/document/document-card.tsx` | `accentIndex` prop; `CARD_ACCENTS` palette; warm shadow lift |
| `app/(dashboard)/workspaces/[workspaceId]/page.tsx` | Passes `accentIndex={i}`; removed ambient glow div; removed "Documents" section label |

---

### Polish — Workspace Header Three-Dot Menu

- Replaced inline `Pencil` + `Trash2` buttons in workspace header with a single `MoreHorizontal` three-dot button
- Button is hidden by default (`opacity-0`), fades in on hover of the title row (`group` / `group-hover:opacity-100`) and on keyboard focus (`focus:opacity-100`) — `transition-opacity duration-150`
- Clicking opens a custom inline dropdown with "Rename" (Pencil icon) and "Delete" (Trash2 icon) items; clicking outside closes via a fixed inset overlay
- Delete item styled in `text-destructive` to signal destructive action

### Files Modified

| File | Notes |
| ---- | ----- |
| `app/(dashboard)/workspaces/[workspaceId]/page.tsx` | Three-dot menu replacing Pencil/Trash2; `menuOpen` state; hover/focus reveal |

---

### Polish — AI Panel Action Button Icons

- Added icons to the three AI action tab buttons: `BookText` (Summarize), `PenLine` (Rewrite), `ChevronsUpDown` (Expand)
- `ACTION_ICON` map added alongside existing `ACTION_LABEL`; buttons updated to `flex items-center gap-2`

### Files Modified

| File | Notes |
| ---- | ----- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | `ACTION_ICON` map; icons rendered in action tab buttons |

---

### Feature — Last Modified Info + Document Sort

- Document cards on workspace page show "Last modified · X hours ago" with exact timestamp (e.g. "Mar 24, 2026 · 2:15 PM") on hover via `title` attribute
- Relative time helper: "just now" / "N minutes ago" / "N hours ago" / "N days ago" / formatted date beyond 7 days; computed on render, no live refresh
- Documents sorted by `updatedAt DESC` on render — most recently edited appears first
- Editor page shows exact "Last modified · Mar 24, 2026 · 2:15 PM" with `Calendar` icon under the title input
- `Doc` type in editor page extended with `updatedAt: string`; `formatExactDate` and `relativeTime` helpers added at module level

### Files Modified

| File | Notes |
| ---- | ----- |
| `components/document/document-card.tsx` | Relative time + hover tooltip; `relativeTime` + `exactDate` helpers |
| `app/(dashboard)/workspaces/[workspaceId]/page.tsx` | Sort documents by `updatedAt DESC` |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | `updatedAt` in `Doc` type; exact timestamp under title; `Calendar` icon; `formatExactDate` + `relativeTime` helpers |

---

### Polish — Debounce Cleanup + Workspace Delete Copy

- Added `useEffect` cleanup in the document editor to `clearTimeout(debounceRef.current)` on unmount — prevents a stale save from firing after the user navigates away
- Workspace delete dialog copy is now conditional: omits "and all documents inside it" when the workspace has no documents; reads `documents.length` from the already-loaded `useDocuments` query

### Files Modified

| File | Notes |
| ---- | ----- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | `useEffect` debounce cleanup on unmount |
| `app/(dashboard)/workspaces/[workspaceId]/page.tsx` | Conditional delete dialog copy |

---

### API Hardening — Timeout + Error Handling

- OpenAI API call timeout reduced to 15s (`{ timeout: 15_000 }`) — tight enough to fail fast on slow responses without cutting off normal generations
- Catch block now detects timeout errors via `err.message.toLowerCase().includes("timeout")` and returns `"AI took too long to respond. Please try again."` instead of the generic `"AI generation failed"`
- `console.error` added in catch block — logs `generationId`, `documentId`, `action`, and error message; visible in Vercel function logs for observability

### Files Modified

| File | Notes |
| ---- | ----- |
| `app/api/ai/generate/route.ts` | 15s timeout; timeout-specific error message; `console.error` logging |

---

## 2026-03-25

### Rate Limiting — AI Generation Endpoint

- Added `lib/rate-limit.ts` — in-memory sliding window rate limiter
- Stores `Map<userId, number[]>` of request timestamps; drops entries older than 60s on each call
- Limit: 12 requests per minute per user
- Returns HTTP 429 with `{ "error": "Too many requests. Please wait a moment." }` when exceeded
- Check fires in `POST /api/ai/generate` immediately after auth, before any OpenAI or DB work
- Marked rate limiting v2 (distributed, Upstash Redis) as a future todo

**Limitation:** Vercel runs multiple serverless instances — each holds its own `Map`, so the limit is per-instance, not globally enforced. Acceptable for v1 cost protection; v2 will use a shared store.

### Files Created/Modified

| File | Change |
| ---- | ------ |
| `lib/rate-limit.ts` | New — sliding window rate limiter |
| `app/api/ai/generate/route.ts` | Added `checkRateLimit` call after auth check |

---

## 2026-03-24 (continued)

### UI Polish — Bubble Menu Visual Refinement

- Removed `backdrop-blur-sm` and semi-transparent background — was causing a hazy/blurry visual artifact; replaced with solid `bg-card`
- Pill shadow lightened: `shadow-lg` → custom `0 2px 12px rgba(0,0,0,0.08)` — floats without heaviness
- Pill border softened: `border-border` → `border-border/60`
- Pill padding/gap increased slightly: `px-1.5 py-1` → `px-2 py-1.5` for breathing room
- Button shape changed from `rounded-full` to `rounded-md` — avoids pill-in-pill visual conflict
- Active state softened: `bg-foreground text-background` (high contrast inversion) → `bg-foreground/10 text-foreground` (soft tint)
- Inactive icon color changed to `text-foreground/80` — crisp and readable, small lift on hover
- Overflow panel item text changed from `text-muted-foreground` → `text-foreground/70`; icon opacity modifier removed so icons inherit text color directly
- Overflow panel matched to pill: solid `bg-card`, same soft border and shadow
- Divider shortened and lightened: `h-4 bg-border` → `h-3 bg-border/50`
- Entry animation added to both pill and overflow panel: `animate-in fade-in zoom-in-95 duration-150` — subtle scale + fade, no bounce
- Button transition tightened: `transition-colors` → `transition-colors duration-100`

### Files Modified

| File | Notes |
| ---- | ----- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | `bubbleBtn` helper; pill container; divider; overflow panel |

---

## 2026-03-24

### AI Panel — Toast Notifications + History Horizontal Scroll

- Added `sonner` (v2.0.7) for toast feedback on AI panel actions
- `toast.success()` fires after: Replace content, Insert at cursor, Copy, Revert to original
- `<Toaster>` placed in `app/(dashboard)/layout.tsx` — position `bottom-right`, duration 2500ms
- Toast styled to Lume theme via `toastOptions.style`: background `#FFF8F0`, border `#F0E8DF`, text `#1A1410`, soft box shadow
- Success icon color overridden to `#F5A623` (lume-amber) via `[data-sonner-toast] [data-icon]` in `globals.css`
- "Undo with Cmd+Z" hint shown below action buttons when a result exists (`displayed?.output?.text`); `text-[0.7rem] text-muted-foreground/60 text-right`
- History list layout changed from vertical `flex-col` to horizontal `flex-row overflow-x-auto` — two cards visible, rest scrollable; scrollbar hidden via `[&::-webkit-scrollbar]:hidden`
- Each history card is `shrink-0 w-[calc(50%-0.25rem)]` with `line-clamp-2` for the snippet
- When `olderGenerations.length > 2`: `ChevronRight` icon overlaid at the right edge with a `bg-linear-to-l from-background` fade — signals that more results are scrollable; `pointer-events-none` so it doesn't block scroll
- `ChevronRight` added to lucide-react import

### Files Modified

| File | Status | Notes |
| ---- | ------ | ----- |
| `app/(dashboard)/layout.tsx` | Modified | `<Toaster>` added with Lume theme options |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | `toast.success()` calls; undo hint; history horizontal scroll + chevron |
| `app/globals.css` | Modified | Sonner icon color override |

### Dependencies Added

| Package | Version | Notes |
| ------- | ------- | ----- |
| `sonner` | 2.0.7 | Lightweight toast library; no Toaster component needed in root layout — placed in dashboard layout only |

---

### AI Panel — Insert at Cursor + Applied State Refinement

- Renamed "Insert below" → "Insert at cursor"; `handleInsertBelow` → `handleInsertAtCursor`
- Insertion uses `editor.commands.insertContent(html)` — inserts at `editor.state.selection`, which ProseMirror preserves even after the editor loses focus (e.g. when user clicks the AI panel button); no `isFocused` check needed
- Derived `isAlreadyApplied` inline (`displayed.id === replacedGenerationId`) within the action buttons block — no new state or props
- Only "Replace content" is disabled when `isAlreadyApplied` — Replace is a terminal state (the result IS the document); "Insert at cursor" stays enabled because it is additive and users may want multiple insertions at different positions
- "Copy" remains enabled at all times
- "Revert to original" visibility unchanged (`displayed.inputSnapshot && isAlreadyApplied`)
- Helper text "This result is already applied to the document." appears only when `isAlreadyApplied`
- No AI logic, hooks, routes, or data flow touched

### Files Modified

| File | Status | Notes |
| ---- | ------ | ----- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | Insert at cursor behavior; `isAlreadyApplied` disables only Replace content |

---

### AI Panel — Spacing, Readability, and Collapsible Result Section

- Tightened outer panel gap `gap-5` → `gap-4`; actions label `mb-2` → `mb-2.5`
- Result section top padding `pt-4` → `pt-5` for a more intentional transition from action tabs
- Stale note: `text-xs text-muted-foreground/60` → `text-[0.8rem] text-muted-foreground/50` — quieter, de-emphasised metadata
- Action buttons section: `gap-1.5 pt-3` → `gap-2 pt-4` for more breathing room
- History section: `gap-1 pt-3` → `gap-1.5 pt-4`; history item padding `px-2.5 py-2` → `px-3 py-2.5`
- Added `ChevronDown` collapse toggle in the result section header — visible only when a result exists
- `resultCollapsed` state (default `false`) collapses everything below the section header: pending state, empty state, rendered markdown, action buttons (Replace content / Insert at cursor / Copy / Revert to original), and the Previous results history list
- Chevron rotates 180° when expanded (acts as ChevronUp) via `transition-transform duration-200`
- No editor logic, hooks, routes, or data flow touched

### Files Modified

| File | Status | Notes |
| ---- | ------ | ----- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | AI panel spacing tweaks + `resultCollapsed` collapse toggle |

---

### Editor Width and Spacing Refinement

- Added `max-w-[680px] mx-auto` writing canvas wrapper around title + divider + Tiptap editor — back link / save-status row stays full-width; writing surface centers at a comfortable reading width
- Increased editor card vertical padding `py-8` → `py-10` for more generous inset above and below content
- Tightened back link row bottom margin `mb-10` → `mb-8` — less dead space before the title
- Tightened title bottom margin `mb-8` → `mb-5` — divider provides visual separation; old gap was redundant
- Divider bottom margin `mb-8` unchanged — intentional transition beat before writing begins
- No editor logic, Tiptap behavior, AI panel, routes, or hooks touched

### Files Modified

| File | Status | Notes |
| ---- | ------ | ----- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | Writing canvas `max-w` wrapper + card/title/back-link spacing adjustments |

---

## 2026-03-23

### Editor Typography Polish

- Refined all `.tiptap-editor .ProseMirror` styles in `app/globals.css` for a calmer, Notion-level reading and writing experience
- Base prose: `font-size: 0.9375rem` (15px) + `line-height: 1.75` — the two primary levers for premium feel
- Paragraphs: increased gap from `0.75rem` → `1rem`
- Headings: each level now has size-specific `margin-top` (2rem / 1.75rem / 1.5rem) to pull them toward what follows, not what precedes; slight `letter-spacing: -0.02em` on H1/H2 for tighter weight; `margin-top: 0` when the heading is the first element in the editor
- Lists: indent increased to `1.5rem`, item gap to `0.375rem`, `line-height: 1.7` on `li`; nested lists get `0.25rem` top/bottom margin so sub-items cluster under their parent without extra visual weight
- Blockquote: border thickened `2px` → `3px`, padding increased to `1rem`
- Code block: slightly larger font (`0.8125rem`), more comfortable padding, `line-height: 1.65`
- HR: margin expanded `1.5rem` → `2rem` for a true section-break feel
- No editor logic, hooks, or component files touched

### Files Modified

| File | Status | Notes |
| ---- | ------ | ----- |
| `app/globals.css` | Modified | Typography scale and spacing inside `.tiptap-editor .ProseMirror` only |

---



### Bubble Menu — Viewport-Aware Side Panel + AI Replace Markdown Fix

#### Bubble menu overflow positioning

- Overflow panel no longer stacks above the pill — it now floats **to the side** (right by default, left when near the right viewport edge)
- `BubbleMenuReact` refactored to a **render prop** (`children: (opts: { flipLeft }) => ReactNode`) so viewport-derived positioning info can flow to the overflow panel without prop-drilling or context
- Overflow panel uses `position: absolute` with `left: calc(100% + 8px)` / `right: calc(100% + 8px)` — never clips at top or bottom of viewport
- Added `showBelow` logic: when selection is within 56px of the top, the whole menu appears **below** the selection (`top: rect.bottom + 8`) instead of above — handles top-edge clipping
- `flipLeft` threshold: when the pill's center is within 224px of the right viewport edge, overflow opens to the left side instead

#### AI replace / insert below — markdown formatting preserved

- `handleReplace` and `handleInsertBelow` now use `marked.parse(text)` — AI output is markdown; Tiptap receives proper HTML with bold, headings, lists, code blocks, etc.
- `textToHtml()` helper removed entirely (was only used for revert; see revert fix below)
- `marked` added as a dependency (`v17.0.5`)

### Files Modified

| File                                                                       | Status   | Notes                                                                                           |
| -------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | Render prop on `BubbleMenuReact`; side-panel overflow; `showBelow`; `marked.parse` for AI ops  |

### Dependencies Added

| Package  | Version | Notes                                                   |
| -------- | ------- | ------------------------------------------------------- |
| `marked` | 17.0.5  | Markdown → HTML for AI replace/insert; sync via `marked.parse()` |

---

### Revert-to-Original Formatting Fix

- **Root cause**: `inputSnapshot` is stored as plain text (captured via `textBetween`). `textToHtml(snapshot)` stripped all rich formatting. The editor showed plain paragraphs instead of the original headings, bold, lists, etc.
- **Fix**: capture `editor.getHTML()` into `originalHtmlRef` immediately before `Replace content` overwrites the editor; `handleRevert` restores that exact HTML snapshot
- `originalHtmlRef` is cleared on user edits (`onUpdate`), `handleInsertBelow`, and after revert completes
- `handleRevert` signature changed to `() => void` — no longer needs a snapshot argument; `AiPanel.onRevert` updated accordingly
- `textToHtml()` helper removed (was only used for revert; no longer needed)

### Files Modified

| File                                                                       | Status   | Notes                                                                     |
| -------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | `originalHtmlRef`; updated `handleReplace`, `handleRevert`, `onUpdate`; removed `textToHtml` |

---

### Revert Button Visibility Fix (`replacedGenerationId`)

- **Root cause**: the revert button condition `content === outputText` compared `textBetween` output (plain text, markdown stripped) against raw AI markdown — always false after `marked.parse()` was introduced
- **Fix**: `replacedGenerationId` state tracks which generation's output is currently in the editor
  - Set to `generation.id` on "Replace content"
  - Cleared on user edits (`onUpdate`), "Insert below", and after revert
  - `isReplacingRef` prevents `onUpdate` from clearing it during programmatic `setContent` calls
- `isStale` updated: replaced `outputText !== content` check with `replacedGenerationId !== displayed?.id`
- Revert button condition updated: `replacedGenerationId === displayed.id` (replaces `content === outputText`)
- `onReplace` prop signature updated to `(text: string, id: string) => void`
- `outputText` local variable removed (no longer needed)

### Files Modified

| File                                                                       | Status   | Notes                                                                               |
| -------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | `replacedGenerationId` state + `isReplacingRef`; updated revert button + isStale conditions |

---

### AI System Message — Always Respond in Markdown

- **Root cause**: after "Replace content", the editor holds rendered HTML; `textBetween` extracts plain prose (no markdown syntax). "Regenerate" sends this plain prose to GPT-4o, which mirrors it back as plain prose — `marked.parse()` has no markdown to convert, so the editor shows unformatted text
- **Fix**: added OpenAI system message: _"You are a writing assistant. Always respond using Markdown formatting… Never return plain unformatted prose."_ — applies to all three actions and to every generation including regenerations
- User-facing prompts kept clean (no redundant markdown instructions)

### Files Modified

| File                              | Status   | Notes                                           |
| --------------------------------- | -------- | ----------------------------------------------- |
| `app/api/ai/generate/route.ts`    | Modified | System message added to OpenAI chat completions |

---

### Tiptap Rich Text Editor

- Replaced `<textarea>` with Tiptap (StarterKit) rich text editor
- Content stored as HTML in the DB; plain text extracted via `editor.state.doc.textBetween(0, size, "\n\n")` for AI calls and staleness comparisons — preserves compatibility with stored `inputSnapshot` values
- Selection-based bubble menu appears above any text selection with a pill-shaped floating bar: **Bold**, **Italic**, **Strike**, **Inline code**, and a **"More" (⋯)** overflow toggle
- Overflow panel exposes: Paragraph, H1/H2/H3, Bullet list, Ordered list, Blockquote, Code block, Divider, Undo, Redo
- `onMouseDown` + `e.preventDefault()` on all bubble buttons keeps the editor selection alive when applying formatting
- Custom `BubbleMenuReact` component (portal to `document.body`) — Tiptap v3 dropped the React component wrapper from `@tiptap/react`; lightweight implementation using `editor.on("selectionUpdate")` + `window.getSelection()` + `createPortal`
- `titleRef` / `saveRef` pattern used to avoid stale closures in `useEditor`'s `onUpdate` callback
- AI actions use `marked.parse()` (Replace content, Insert at cursor) or restore `originalHtmlRef` (Revert to original) — `textToHtml()` helper was later removed
- Autosave preserved: `onUpdate` fires HTML → `save(title, html)` via debounce
- ProseMirror content styles added to `globals.css` (.tiptap-editor scope): headings, lists, blockquote, code block, inline code, horizontal rule, placeholder
- Old plain-text documents load correctly — Tiptap wraps unstructured content in `<p>` on first render

### Files Modified

| File                                                                       | Status   | Notes                                                                                      |
| -------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | Replaced textarea with Tiptap editor + custom BubbleMenuReact; updated all content handlers |
| `app/globals.css`                                                          | Modified | Added `.tiptap-editor` ProseMirror styles                                                  |

### Dependencies Added

| Package                        | Version | Notes                                                      |
| ------------------------------ | ------- | ---------------------------------------------------------- |
| `@tiptap/react`                | 3.20.4  | Core React integration (`useEditor`, `EditorContent`)      |
| `@tiptap/starter-kit`          | 3.20.4  | All standard extensions (Bold, Italic, Headings, Lists...) |
| `@tiptap/extension-bubble-menu`| 3.20.4  | Installed but not used — Tiptap v3 dropped React wrapper; custom component used instead |

### Edge Cases Handled

- Old plain-text DB content renders correctly in Tiptap (wrapped in `<p>` on load)
- `textBetween` with `"\n\n"` separator matches stored `inputSnapshot` format → staleness and revert comparisons remain accurate
- Stale closure on `title` inside `onUpdate` handled via `titleRef` pattern
- `textToHtml` was removed — AI output is now inserted via `marked.parse()` (HTML) or `originalHtmlRef` (revert); no plain-text injection path remains

---

### Manual Testing Pass

- Performed full manual test pass across all features built to date
- All tests passed — results recorded in the consolidated checklist at the end of this file
- Cleaned up duplicate test block (AI History List) that existed mid-file; consolidated checklist is now the single source of truth

---

### Revert to Original (v1)

- Added a "Revert to original" button to the AI panel action area
- Button appears only after the user clicks "Replace content" — i.e. when `content === outputText` and `inputSnapshot` exists on the displayed generation
- Clicking it restores the editor to the document content captured at generation time (`inputSnapshot`) and triggers autosave
- Button disappears automatically if the user edits further — no extra state, purely derived condition
- No schema, API, or hook changes — fully localized to the document editor page

### Files Modified

| File                                                                       | Status   | Notes                                                                                                           |
| -------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | Added `onRevert` prop to `AiPanel`; `handleRevert` in `DocumentEditor`; conditional "Revert to original" button |

---

### Markdown Rendering in AI Panel

- Replaced plain-text `<p>` output in the AI panel with `ReactMarkdown`
- Supports: paragraphs, bold, italic, headings, bullet/numbered lists, inline code, code blocks, blockquotes
- Headings rendered at body size (`font-semibold`) to stay restrained inside the narrow panel — not blog-like
- Code blocks: monospace, muted background, horizontal scroll; inline code: muted background pill
- All other panel behavior unchanged — history, staleness, action buttons, stale note

### Files Modified

| File                                                                       | Status   | Notes                                                                        |
| -------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | Replaced `<p>` plain-text output with `ReactMarkdown` + custom component map |

### Dependencies Added

| Package          | Version | Notes                                                   |
| ---------------- | ------- | ------------------------------------------------------- |
| `react-markdown` | latest  | Lightweight markdown renderer; no remark plugins needed |

---

### Document Delete Confirmation Dialog

- Replaced `window.confirm()` on document delete with a proper shadcn/ui `Dialog` — matches the workspace delete pattern
- Delete button in the editor header now opens the dialog instead of firing immediately
- Dialog includes: title, warning message, inline error on failure, cancel button, and a destructive confirm button
- Confirm button shows "Deleting…" and is disabled while the mutation is in flight — prevents duplicate submissions
- On success: dialog closes and user is redirected back to the workspace
- On error: dialog stays open and shows an inline error message

### Files Modified

| File                                                                       | Status   | Notes                                                                                                      |
| -------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | Replaced `confirm()` with Dialog; added `deleteOpen`, `deleteError` state; loading state on confirm button |

---

### State Management Audit

- Audited workspace list, workspace detail, document editor, AI panel, and all related hooks
- No server-derived data incorrectly held in local state — TanStack Query is the source of truth throughout
- Local state is correctly limited to: form inputs before submit, dialog open/close flags, transient editor typing state, and ephemeral AI panel UI (selected action, selected history item, pending flag)
- Fix applied: `useDeleteDocument` now removes `["document", id]` and `["aiGenerations", id]` from the query cache on success — prevents stale entries if the user navigates back after deletion
- Architecture consistent; audit marked complete

### Files Modified

| File                    | Status   | Notes                                                         |
| ----------------------- | -------- | ------------------------------------------------------------- |
| `hooks/use-document.ts` | Modified | `useDeleteDocument` cleans up document + AI generations cache |

---

## 2026-03-21

### Deployment Pass — Vercel

- Deployed Lume to Vercel at https://lume-psi-teal.vercel.app/
- Wired all production env vars: `DATABASE_URL`, `CLERK_SECRET_KEY`, `OPENAI_API_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- All features verified end-to-end in production: auth, workspaces, documents, autosave, AI panel (generate / regenerate / history / persistence), settings page

---

### Pre-Deploy Audit + ReactQueryDevtools Fix

- Audited codebase for build-time issues, type issues, env assumptions, client/server boundaries, and production pitfalls
- Fixed `ReactQueryDevtools` rendering unconditionally in production — now gated behind `process.env.NODE_ENV === "development"` in `components/providers.tsx`
- Confirmed Prisma and OpenAI singleton patterns (`!== "production"` check) are correct per official recommendations — no change needed
- Added 5 post-deploy improvement todos to ARCHITECTURE.md: rate limiting, OpenAI timeout, error logging, AI generations cache cleanup on document delete, debounce cleanup on unmount

### Files Modified

| File                       | Status   | Notes                                        |
| -------------------------- | -------- | -------------------------------------------- |
| `components/providers.tsx` | Modified | ReactQueryDevtools gated to development only |
| `ARCHITECTURE.md`          | Modified | 5 post-deploy improvement todos added        |

---

### Settings Page (Placeholder)

- Created `app/(dashboard)/settings/page.tsx` — resolves the 404 on the existing sidebar `/settings` link
- Page includes: `Account` section label, serif `Settings` heading, short description, and a "Coming soon" card
- No forms or real settings functionality — intentional placeholder consistent with Lume styling

### Files Created

| File                                | Status  | Notes                             |
| ----------------------------------- | ------- | --------------------------------- |
| `app/(dashboard)/settings/page.tsx` | Created | Placeholder settings page, no 404 |

---

### Production Build Pass + Bug Fixes

#### Build error — Clerk `UserButton` prop removed (`components/layout/sidebar.tsx`)

- `afterSignOutUrl` was removed in Clerk v7 — prop no longer exists on `UserButton`
- Removed the prop; Clerk v7 redirects to `/` after sign-out by default

#### Build warning — conflicting lockfiles

- Stray `package.json` + `package-lock.json` existed at `/Users/rathnac/` (leftover from a gsap/three.js experiment)
- Deleted both files — Next.js no longer detects a conflicting lockfile above the project root
- Added `outputFileTracingRoot: path.join(__dirname)` to `next.config.ts` to pin the tracing root to the project directory

#### Build warning — deprecated `middleware` file convention

- Next.js 16 deprecated `middleware.ts` in favour of `proxy.ts`
- Renamed `middleware.ts` → `proxy.ts`; updated export name from `middleware` to `proxy`

#### AI panel — staleness false positive after "Replace content"

- **Bug:** clicking "Replace content" set the editor content to the AI output, but the panel still showed the stale warning because `inputSnapshot !== content`
- **Fix:** staleness now clears when `content === outputText` (the generated result) in addition to `content === inputSnapshot`
- Edge case preserved: if the user edits further after replacing, content drifts from both and the stale note reappears correctly
- Only `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` changed

#### Result

- `pnpm build` compiles successfully with no TypeScript errors or warnings
- `pnpm start` serves the production build correctly

### Files Modified

| File                                                                       | Status   | Notes                                                           |
| -------------------------------------------------------------------------- | -------- | --------------------------------------------------------------- |
| `components/layout/sidebar.tsx`                                            | Modified | Removed deprecated `afterSignOutUrl` prop from `UserButton`     |
| `next.config.ts`                                                           | Modified | Added `outputFileTracingRoot` + `path` import                   |
| `middleware.ts` → `proxy.ts`                                               | Renamed  | File renamed; export renamed from `middleware` to `proxy`       |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | Staleness logic updated — not stale when content matches output |

### Up Next

- **Deployment pass** — deploy to Vercel, wire production env vars, verify all features in prod
- Replace `confirm()` on document delete with a proper confirmation dialog
- Audit persisted server data currently held only in local UI state
- Markdown rendering in AI panel (react-markdown) — lower priority
- Rich text editor with formatting toolbar (Tiptap) — lower priority

---

## 2026-03-19

### AI Panel — History List per Action

#### Editor page (`app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx`)

- Added `relativeTime` inline helper — formats `createdAt` as `Xm ago / Xh ago / Xd ago`
- Added `selectedGenerationId: string | null` state to `DocumentEditor` — `null` means show latest
- Added `handleSelectAction` — wraps `setSelectedAction`, also resets `selectedGenerationId` to `null` on tab switch
- `handleGenerate` `onSuccess` now also resets `selectedGenerationId` to `null` — panel snaps to newest after regenerate
- `AiPanel` derives `actionGenerations` (all SUCCESS for selected action), `latest` (index 0), `displayed` (by id or latest), `isViewingLatest`, `olderGenerations` (slice(1))
- Staleness detection now only applies when `isViewingLatest` — older items never show the stale note
- Regenerate button only shown when `isViewingLatest` — replaced by "Back to latest" when viewing an older item
- "Previous" section rendered below result area when `olderGenerations.length > 0` — compact list with relative timestamp + 80-char text snippet
- Clicking a history item sets `selectedGenerationId` and updates the displayed result
- Selected history item has a subtle `bg-muted` + `border-border` highlight

### Files Modified

| File                                                                       | Status   | Notes                                                         |
| -------------------------------------------------------------------------- | -------- | ------------------------------------------------------------- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | History list, selectedGenerationId state, relativeTime helper |

### Up Next

- **Deployment pass** — deploy to Vercel, wire production env vars, verify all features in prod
- Replace `confirm()` on document delete with a proper confirmation dialog
- Audit persisted server data currently held only in local UI state
- Markdown rendering in AI panel (react-markdown) — lower priority
- Rich text editor with formatting toolbar (Tiptap) — lower priority

---

### AI Panel — Loading / Empty / Error States

#### Editor page (`app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx`)

- Added `generationsLoading`, `generationsError`, `onRetry` props to `AiPanel`
- Loading state: animated skeleton (4 rows, `animate-pulse`) shown below action tabs when `useAiGenerations` is in-flight; only appears on first mount since `staleTime: Infinity`
- Error state: "Couldn't load your previous results." + "Try again" button that calls `refetch`; shown when query fails
- Result area (empty state, persisted result, pending) now guarded by `!generationsLoading && !generationsError` — three states are mutually exclusive
- Action tabs remain visible and interactive in all states
- `DocumentEditor` now destructures `isLoading`, `isError`, `refetch` from `useAiGenerations` and passes them down

### Files Modified

| File                                                                       | Status   | Notes                                                         |
| -------------------------------------------------------------------------- | -------- | ------------------------------------------------------------- |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | Loading skeleton, error state with retry, guarded result area |

### Up Next

- Audit persisted server data currently held only in local UI state
- Markdown rendering in AI panel (react-markdown) — lower priority
- Rich text editor with formatting toolbar (Tiptap) — lower priority

---

### AI Panel — Action-Driven + Persistence-Aware

#### Generations route (`app/api/documents/[documentId]/generations/route.ts`)

- Added `inputSnapshot` to the select — required for client-side staleness detection

#### Hook (`hooks/use-ai.ts`)

- Added `inputSnapshot: string | null` to the `AiGeneration` interface

#### Editor page (`app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx`)

- Action tabs now select the view (no longer trigger generation directly)
- Panel reads from `useAiGenerations(documentId)` — all results are persistence-driven
- Looks up latest `SUCCESS` generation per selected action via `type === action.toUpperCase()`
- Staleness: `persisted.inputSnapshot !== content` — direct string comparison; shows a subtle italic note
- Regenerate: always available when a result exists; fires the existing `generateAi` mutation
- Generate: shown in empty state when no result exists for the selected action
- `pendingAction` state tracks the in-flight action; all generate/regenerate buttons disabled while any action is pending
- Removed `aiResult` ephemeral state — panel is fully driven by persisted data
- Removed `activeAction` state — replaced by `selectedAction` (tab) and `pendingAction` (in-flight)

### Files Modified

| File                                                                       | Status   | Notes                                                         |
| -------------------------------------------------------------------------- | -------- | ------------------------------------------------------------- |
| `app/api/documents/[documentId]/generations/route.ts`                      | Modified | Added `inputSnapshot` to select                               |
| `hooks/use-ai.ts`                                                          | Modified | Added `inputSnapshot` to `AiGeneration` interface             |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | Action-driven panel with persistence + staleness + regenerate |

### Up Next

- AI history list per action (show all past runs, not just latest)
- Loading / error states for `useAiGenerations` in the panel

---

### AI Generations Hook + Editor Layout Refactor

#### Hook (`hooks/use-ai.ts`)

- Added `AiGeneration` interface (`id`, `type`, `status`, `model`, `output`, `createdAt`)
- Added `fetchAiGenerations` fetch function → `GET /api/documents/[documentId]/generations`
- Added `useAiGenerations(documentId)` — `useQuery` with key `["aiGenerations", documentId]`; disabled when `documentId` is falsy; `staleTime: Infinity` — fetches once on mount, never refetches on window focus or remount, only refreshed via explicit `invalidateQueries` after mutation
- Updated `useGenerateAi()` to call `queryClient.invalidateQueries({ queryKey: ["aiGenerations", documentId] })` on success via `variables.documentId`

#### Editor layout refactor (`app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx`)

- Replaced single-column layout with a desktop-first two-surface layout
- Page background: `bg-muted` (`#F2EDE8` Lume mist) with `p-4 md:p-6`
- Editor surface: `bg-card` (white), `rounded-2xl`, `border-border`, `shadow-sm` — primary writing sheet
- AI panel: `w-[380px]`, `bg-background` (`#FFF8F0` Lume warm), `rounded-2xl`, `border-border`, `shadow-sm`, `sticky top-6` — persistent right column
- AI result no longer renders below the fold; lives in the panel at all times
- Panel includes: action buttons, scrollable result area (`max-h-[40vh]`), apply actions (Replace / Insert below / Copy), idle empty state
- Extracted `AiPanel` as a small internal component; all existing business logic unchanged
- Responsive: `flex-col` on mobile, `flex-row` on `lg:` breakpoint
- Added `Sparkles` icon (Lume amber) beside "AI Assistant" panel heading

#### Sidebar fix (`components/layout/sidebar.tsx`)

- Logo section changed from `py-4` to `h-14 flex items-center` to match the header's `h-14` — aligns the horizontal dividers across sidebar and main content area

### Files Modified

| File                                                                       | Status   | Notes                                                           |
| -------------------------------------------------------------------------- | -------- | --------------------------------------------------------------- |
| `hooks/use-ai.ts`                                                          | Modified | Added `useAiGenerations` hook + invalidation in `useGenerateAi` |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | Two-surface layout: editor card + persistent AI panel           |
| `components/layout/sidebar.tsx`                                            | Modified | Logo section height fixed to `h-14` to align with header        |

### Up Next

1. **AI history** — surface previous generations in the AI panel (generation list / history tab)
2. **Regenerate flow** — explicit re-run button per generation type
3. **Loading / empty / error states** for `useAiGenerations` in the panel

---

### AI Generations Read Route

#### Route (`app/api/documents/[documentId]/generations/route.ts`)

- Created new route file at `GET /api/documents/[documentId]/generations`
- Auth via `requireCurrentDbUser()`; returns 401 if unauthenticated
- Ownership verified by `prisma.document.findFirst({ where: { id, workspace: { userId } } })`; returns 404 if not found or not owned
- Queries `AiGeneration` rows for the document, ordered `createdAt desc`
- Returns `{ generations: [{ id, type, status, model, output, createdAt }] }` — no internal fields exposed

### Files Created

| File                                                  | Status  | Notes                                   |
| ----------------------------------------------------- | ------- | --------------------------------------- |
| `app/api/documents/[documentId]/generations/route.ts` | Created | GET handler only — no POST/PATCH/DELETE |

### Up Next

1. **Hook** — `useAiGenerations(documentId)` TanStack Query hook: fetches from above route; invalidated after successful AI mutation
2. **Frontend** — Surface latest `SUCCESS` generation in the document editor AI panel on load

---

### Workspace DELETE Route + Delete UI

#### Workspace DELETE API (`app/api/workspaces/[workspaceId]/route.ts`)

- Added `DELETE` handler — auth + ownership check, then `prisma.workspace.delete`
- Returns 204 No Content on success; 401/404 as appropriate
- Cascade deletes all documents and their AI generations via Prisma schema relations

#### Hook (`hooks/use-workspaces.ts`)

- Added `deleteWorkspace` fetch function
- Added `useDeleteWorkspace()` mutation — on success removes `["workspace", id]` from cache and invalidates `["workspaces"]` list

#### Workspace delete UI (`app/(dashboard)/workspaces/[workspaceId]/page.tsx`)

- Trash2 icon (14px, muted → destructive on hover) beside pencil icon in workspace header
- Clicking opens a confirmation dialog — no accidental deletes
- Warning copy: "This will permanently delete this workspace and all documents inside it. This action cannot be undone."
- "Delete workspace" button disabled while deleting; shows "Deleting…" during in-flight
- On success: redirects to `/workspaces`, cache cleaned up
- On error: inline error message shown in dialog

### Files Modified

| File                                                | Status   | Notes                                            |
| --------------------------------------------------- | -------- | ------------------------------------------------ |
| `app/api/workspaces/[workspaceId]/route.ts`         | Modified | Added DELETE handler with auth + ownership check |
| `hooks/use-workspaces.ts`                           | Modified | Added `useDeleteWorkspace` mutation hook         |
| `app/(dashboard)/workspaces/[workspaceId]/page.tsx` | Modified | Added trash icon trigger + confirmation dialog   |

### Up Next

**AI Generations feature — 3 sequential tasks, each committed separately:**

1. **Backend** — `GET /api/documents/[documentId]/generations` route: auth + document ownership check, returns all generations newest-first
2. **Hook** — `useAiGenerations(documentId)` TanStack Query hook: fetches from above route; invalidated after successful AI mutation
3. **Frontend** — Surface latest `SUCCESS` generation in the document editor AI panel on load

---

## 2026-03-18

### Workspace PATCH Route + Rename UI

#### Workspace PATCH API (`app/api/workspaces/[workspaceId]/route.ts`)

- Added `PATCH` handler — Zod-validated body (`name`, `description`, `emoji`); at least one field required
- Auth + ownership check before update; returns 401/404/400 as appropriate
- Partial update — only provided fields written to DB
- Returns updated workspace shape consistent with `GET`

#### Hook (`hooks/use-workspaces.ts`)

- Added `UpdateWorkspaceInput` interface and `updateWorkspace` fetch function
- Added `useUpdateWorkspace()` mutation — on success sets `["workspace", id]` cache directly and invalidates `["workspaces"]` list

#### Workspace rename UI (`app/(dashboard)/workspaces/[workspaceId]/page.tsx`)

- Pencil icon (14px, muted) beside the workspace name — visible but low-prominence
- Clicking pre-fills a dialog with current name, description, and emoji
- Dialog fields: emoji (small input), name (required), description (optional)
- Save button disabled while saving or name is empty; shows "Saving…" during in-flight
- On success: cache updated immediately, dialog closes, workspace list also refreshed

### Files Modified

| File                                                | Status   | Notes                                                     |
| --------------------------------------------------- | -------- | --------------------------------------------------------- |
| `app/api/workspaces/[workspaceId]/route.ts`         | Modified | Added PATCH handler with Zod validation + ownership check |
| `hooks/use-workspaces.ts`                           | Modified | Added `useUpdateWorkspace` mutation hook                  |
| `app/(dashboard)/workspaces/[workspaceId]/page.tsx` | Modified | Added edit dialog + pencil trigger                        |

### Up Next

1. Workspace DELETE route
2. Workspace delete UI flow
3. AI generations read route (`GET /api/documents/[id]/generations`)
4. `useAiGenerations(documentId)` hook
5. Surface latest persisted AI generation in the editor / AI panel
6. Invalidate AI generations query after successful AI mutation

---

### Document Delete Feature

#### What was already in place

- `DELETE /api/documents/[documentId]` was fully implemented (auth + ownership check + hard delete)
- `deleteDocument` fetch function and `useDeleteDocument` mutation hook existed in `hooks/use-document.ts`

#### What was added

- Wired up `useDeleteDocument` and `useRouter` in the `DocumentEditor` component
- Added `handleDelete` — calls `confirm()` for confirmation, then fires the mutation; on success redirects to `/workspaces/[workspaceId]`
- Added a low-prominence "Delete" button in the top-right header (beside the save status); shows "Deleting…" and disables during in-flight request

### Files Modified

| File                                                                       | Status   | Notes                                                        |
| -------------------------------------------------------------------------- | -------- | ------------------------------------------------------------ |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | Added delete handler + button; no API or hook changes needed |

### Up Next

1. Workspace PATCH route (rename + description update)
2. Workspace rename UI flow
3. Workspace DELETE route
4. Workspace delete UI flow
5. AI generations read route (`GET /api/documents/[id]/generations`)
6. `useAiGenerations(documentId)` hook
7. Surface latest persisted AI generation in the editor / AI panel
8. Invalidate AI generations query after successful AI mutation

---

## 2026-03-17

### AI Generation Layer (API + Frontend)

#### OpenAI client (`lib/openai.ts`)

- Singleton pattern via `globalThis` — safe for Next.js hot reload

#### AI API (`app/api/ai/generate/route.ts`)

- `POST /api/ai/generate` — Zod-validated body (`documentId`, `action`, `content`, `instructions?`)
- Actions: `summarize`, `rewrite`, `expand`
- Ownership check: document must belong to a workspace owned by the authenticated user
- Creates `AiGeneration` row as `PENDING` → calls GPT-4o → updates to `SUCCESS` or `ERROR`
- Returns `{ generation: { id, type, status, output } }`
- Output shape: `{ text: string }` stored in `output` JSON field

#### Hook (`hooks/use-ai.ts`)

- `useGenerateAi()` — mutation hook for `POST /api/ai/generate`
- Types: `AiAction`, `GenerateAiInput`, `AiGenerationResult`

#### Editor AI toolbar (`app/(dashboard)/workspaces/.../documents/.../page.tsx`)

- Three action buttons above the textarea: Summarize, Rewrite, Expand
- Buttons disabled when content is empty or a request is in flight
- Active button shows "Running…" during request
- Result panel appears below the textarea with: Replace content, Insert below, Copy
- Replace and Insert below both trigger autosave immediately
- Dismissible result panel

### Files Created / Modified

| File                                                                       | Status   | Notes                                                                 |
| -------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| `lib/openai.ts`                                                            | Created  | Singleton OpenAI client                                               |
| `app/api/ai/generate/route.ts`                                             | Created  | POST AI actions with Zod + ownership check + AiGeneration persistence |
| `hooks/use-ai.ts`                                                          | Created  | `useGenerateAi()` mutation hook                                       |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | AI toolbar + result panel with apply/copy actions                     |

### AI Persistence Behavior

- Every generation is written to `AiGeneration` (PENDING → SUCCESS/ERROR) as an audit trail
- The UI surfaces the immediate mutation response via local `useState`; no read path exists yet
- `ARCHITECTURE.md` updated: Type & State Ownership, Route Map, Loading/Error/Empty States, Key Decisions, AI Generation Flow section, and Pending Work section

### Document Editor — Bug Fix & Refactor

#### Problem

`document` was used as the variable name for the TanStack Query result, shadowing the global DOM `Document` type. TypeScript resolved `document.content` against the DOM type (which has no `content` property), causing a type error. A secondary lint error (`react-hooks/set-state-in-effect`) fired because local state was seeded inside a `useEffect`.

#### Fix

- Renamed `data: document` → `data: doc` to avoid the global shadow
- Removed `useEffect` + `initialized` state entirely
- Split the page into two components:
  - `DocumentEditorPage` — handles loading/error states, renders nothing until `doc` is ready
  - `DocumentEditor` — receives `doc` as a prop, initializes `title` and `content` directly from props at mount time (no effect needed)
- Added `key={documentId}` so navigating between documents remounts the editor cleanly

### Files Modified

| File                                                                       | Status   | Notes                                                                                      |
| -------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Modified | Split into two components; removed useEffect state seeding; fixed document variable shadow |

### Up Next

- Add document delete feature
- Add AI generations read route + `useAiGenerations` hook
- Surface persisted AI generation in the editor

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

| File                                                | Status  | Notes                                      |
| --------------------------------------------------- | ------- | ------------------------------------------ |
| `app/api/workspaces/[workspaceId]/route.ts`         | Created | GET single workspace with ownership check  |
| `app/api/documents/route.ts`                        | Created | GET list + POST create with Zod validation |
| `hooks/use-documents.ts`                            | Created | TanStack Query hooks for document CRUD     |
| `components/document/document-card.tsx`             | Created | Clickable card with title, summary, date   |
| `app/(dashboard)/workspaces/[workspaceId]/page.tsx` | Created | Workspace detail page with document list   |

### Document Editor (API + Frontend)

#### Document API (`app/api/documents/[documentId]/route.ts`)

- `GET /api/documents/[id]` — returns full document including content; 401/404 with ownership check
- `PATCH /api/documents/[id]` — Zod-validated body (`title?`, `content?`); updates only fields provided; returns updated document
- `DELETE /api/documents/[id]` — deletes document; 401/404 with ownership check
- Ownership verified via `workspace.userId` join — can't access documents in workspaces you don't own

#### Hooks (`hooks/use-document.ts`)

- `useDocument(documentId)` — fetches single document with content; cache key `["document", id]`
- `useUpdateDocument()` — PATCHes document; writes result directly into cache (no extra refetch)
- `useDeleteDocument()` — DELETEs document; caller handles redirect

#### Editor page (`app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx`)

- Back link to workspace, title input (serif, large), content textarea (full height, light)
- Debounced autosave: 800ms after last keystroke → PATCH → status shows `Saving…` / `Saved` / `Error`
- Loading skeleton, not-found/error state

### Files Created / Modified

| File                                                                       | Status  | Notes                                           |
| -------------------------------------------------------------------------- | ------- | ----------------------------------------------- |
| `app/api/documents/[documentId]/route.ts`                                  | Created | GET + PATCH + DELETE with Zod + ownership check |
| `hooks/use-document.ts`                                                    | Created | Single document fetch + update + delete hooks   |
| `app/(dashboard)/workspaces/[workspaceId]/documents/[documentId]/page.tsx` | Created | Editor with debounced autosave                  |

### Up Next

- `app/api/ai/generate/route.ts` — POST AI actions (summarize, rewrite, expand, etc.)
- AI toolbar/panel in the editor
- Wire `AiGeneration` model to store results

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

| File                                      | Status   | Notes                                                                 |
| ----------------------------------------- | -------- | --------------------------------------------------------------------- |
| `app/(dashboard)/layout.tsx`              | Modified | Bootstrap optimized: findUnique + conditional create with transaction |
| `lib/auth.ts`                             | Created  | `requireCurrentDbUser()` — Clerk → DB user bridge                     |
| `app/api/workspaces/route.ts`             | Created  | GET + POST with Zod validation                                        |
| `hooks/use-workspaces.ts`                 | Created  | TanStack Query hooks for workspace CRUD                               |
| `components/workspace/workspace-card.tsx` | Created  | Whole-card link, minimal styling                                      |
| `app/(dashboard)/workspaces/page.tsx`     | Modified | Real page replacing placeholder                                       |
| `components/ui/dialog.tsx`                | Created  | shadcn dialog (base-ui)                                               |
| `components/ui/input.tsx`                 | Created  | shadcn input (base-ui)                                                |

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

| File                                  | Status   | Notes                                                           |
| ------------------------------------- | -------- | --------------------------------------------------------------- |
| `app/(dashboard)/layout.tsx`          | Created  | Server component — user bootstrap + app shell                   |
| `app/(dashboard)/page.tsx`            | Created  | Redirects to `/workspaces`                                      |
| `app/(dashboard)/workspaces/page.tsx` | Created  | Placeholder                                                     |
| `components/layout/sidebar.tsx`       | Created  | Nav + active state + Clerk UserButton                           |
| `components/layout/header.tsx`        | Created  | Top bar with optional title                                     |
| `middleware.ts`                       | Modified | `export const middleware` (Next.js 16 named export requirement) |
| `app/layout.tsx`                      | Modified | Clerk v7 redirect props on `ClerkProvider`                      |

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

| File                                         | Status   | Notes                                                         |
| -------------------------------------------- | -------- | ------------------------------------------------------------- |
| `app/layout.tsx`                             | Modified | Added `ClerkProvider` as outermost wrapper                    |
| `app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Created  | Clerk `<SignIn />` component, centered layout                 |
| `app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Created  | Clerk `<SignUp />` component, centered layout                 |
| `middleware.ts`                              | Created  | `clerkMiddleware` + `createRouteMatcher` for route protection |

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

| File                                                  | Status   | Notes                                                                           |
| ----------------------------------------------------- | -------- | ------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                                | Created  | User, Workspace, Document, Tag, AiGeneration models + enums                     |
| `lib/prisma.ts`                                       | Created  | Singleton pattern via globalThis — safe for Next.js hot reload                  |
| `prisma/migrations/20260311200403_init/migration.sql` | Created  | First migration — creates all tables in Neon                                    |
| `ARCHITECTURE.md`                                     | Modified | Marked shared env, prisma singleton, prisma schema, and first migration as done |

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

| File              | Status   | Notes                                                                     |
| ----------------- | -------- | ------------------------------------------------------------------------- |
| `.env.example`    | Created  | Template for DATABASE_URL, Clerk keys, OpenAI key, Clerk redirect URLs    |
| `.env.local`      | Created  | Git-ignored; real secrets go here                                         |
| `.gitignore`      | Modified | Allow `.env.example` to be committed                                      |
| `lib/env.ts`      | Created  | Server-only env validation; import this instead of `process.env` directly |
| `ARCHITECTURE.md` | Modified | Reordered implementation checklist; added bootstrap decision              |

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
  - **Tagline chosen:** _"Think clearly. Write better. Learn faster."_
  - **Logo mark:** 4-layer CSS orb (outer ring, mid ring, core glow, spark) — animates on hero

### Files Created / Modified

| File                  | Status   | Notes                                                        |
| --------------------- | -------- | ------------------------------------------------------------ |
| `app/globals.css`     | Modified | Brand CSS vars, shadcn token overrides, lume animations      |
| `app/layout.tsx`      | Modified | DM Sans + DM Serif Display via next/font, metadata           |
| `components/logo.tsx` | Created  | `<LumeMark>` animated icon + `<LumeLogo>` wordmark component |
| `app/page.tsx`        | Modified | Landing page — hero, features grid, footer                   |

### Decisions Made

- Using **pnpm** over npm/bun for speed + compatibility
- Using **Prisma v6** (not v7) due to Node.js 20.10 version constraint (v7 requires 20.19+)
- **No `src/` directory** — `app/`, `components/`, `lib/` at root level
- `@/*` import alias configured

---

## Manual Test Checklist

### Auth

- [x] Sign in → redirects to `/workspaces`
- [x] Sign out → redirects to landing page
- [x] Unauthorized access to protected route → redirected to `/sign-in`

### Workspace

- [x] New user → default "My Workspace" created _(new signups only — existing accounts unaffected; bootstrap logic verified in code)_
- [x] Create workspace → appears in list
- [x] Rename workspace → updates correctly
- [x] Delete workspace → cascades documents and redirects to `/workspaces`

### Document

- [x] Create document → redirects to editor
- [x] Autosave works (title + content)
- [x] Delete document → redirects to workspace page
- [x] Delete document → confirm dialog appears before deleting
- [x] Cancel delete dialog → document unchanged
- [x] Confirm delete → spinner shows, redirected to workspace, document removed from list
- [x] Delete error → dialog stays open with inline error message; button disabled while in-flight

### AI

- [x] Summarize works
- [x] Rewrite works
- [x] Expand works
- [x] Replace content updates editor and autosaves
- [x] Insert below works
- [x] AI failure handled gracefully

### AI Panel — Action-Driven + Persistence-Aware

- [x] Clicking an action tab (Summarize / Rewrite / Expand) selects it without triggering generation
- [x] Empty state shown when no generation exists for the selected action
- [x] "Generate" button triggers generation for the selected action
- [x] Result appears in the panel after generation (driven by persisted data, not ephemeral state)
- [x] Switching tabs shows the correct persisted result for each action independently
- [x] Reload the page — previously generated results are still shown for each action
- [x] Edit the document content after generating → stale note appears
- [x] Stale note reads: "This result may be outdated. It was generated from an earlier version of this document."
- [x] No stale note shown when content matches the snapshot exactly
- [x] "Regenerate" button appears when viewing the latest result; clicking it creates a new generation
- [x] "Regenerate" is hidden when viewing an older history item — "Back to latest" shown instead
- [x] While generating (pending): Regenerate shows "Running…" and is disabled
- [x] While generating with no existing result: "Running…" text shown in panel
- [x] Replace content, Insert below, Copy all work on persisted results
- [x] Only one action can be pending at a time (Generate/Regenerate disabled while any action runs)

### AI Panel — Loading / Error States

- [x] On first page load, skeleton appears in panel while generations are fetching
- [x] Skeleton only shows when an action tab is selected
- [x] Error state shows "Couldn't load your previous results." with "Try again" button if fetch fails
- [x] "Try again" refetches successfully and restores the panel
- [x] Action tabs remain clickable during loading and error states

### AI Panel — History List

- [x] Generate a result — latest shown in main result area, no "Previous" section yet
- [x] Regenerate once or twice — "Previous" section appears below with older items
- [x] Click an older history item — result area updates, "Back to latest" appears, "Regenerate" hides
- [x] Click "Back to latest" — panel returns to newest result, "Regenerate" reappears
- [x] Switch action tabs — selection resets, no stale history selection carries across actions
- [x] Generate a new result while viewing an older item — panel resets to the new latest
- [x] Staleness note only appears when viewing the latest result, not older items
- [x] Replace content / Insert below / Copy all work on whichever result is currently displayed
- [x] History item timestamps display correctly (e.g. "2m ago", "1h ago")
- [x] History item snippet shows first ~80 chars of output text

### AI Panel — Markdown Rendering & Revert to Original

- [x] AI output with varied content (bold, lists, headings) renders with proper markdown formatting
- [x] AI output with a code block → monospace block with muted background, horizontal scroll for long lines
- [x] AI output with inline code → small muted pill
- [x] Panel layout, history list, stale note, and action buttons unaffected by markdown rendering
- [x] Click **Replace content** → "Revert to original" button appears below Copy
- [x] Click **Revert to original** → editor content restored to pre-AI text; autosave fires
- [x] After reverting, "Revert to original" button disappears (content no longer matches AI output)
- [x] Editing after "Replace content" without reverting → button disappears
- [x] Viewing an older generation → button only appears if that generation's output matches current content

---

## Pending / To-Do

### Image Paste in Editor

Two approaches identified — implement in order:

**Phase 1 — Base64 (ship now, no infra required)**
- [ ] Install `@tiptap/extension-image`
- [ ] Add `Image` to `extensions` array in `useEditor`
- [ ] Add `editorProps.handlePaste` to intercept clipboard image files, convert to base64 data URL via `FileReader`, and insert as an image node
- [ ] Verify paste works from screenshots, browser copy, and design tools
- [ ] Note: base64 bloats `Document.content` in the DB — acceptable short-term, migrate in Phase 2

**Phase 2 — S3 Upload (production path)**
- [ ] Add `POST /api/upload` route — accepts a file, returns a permanent URL (presigned upload or proxy)
- [ ] Replace `FileReader.readAsDataURL` with a `fetch` to the upload endpoint
- [ ] Insert image node using the returned URL instead of a data URL
- [ ] Aligns with the planned migration of document content storage to AWS S3

# Lume — Build Progress

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
- [ ] Prisma schema — User, Workspace, Document, Tag, AiGeneration models
- [ ] Clerk auth setup + middleware
- [ ] Folder structure — `lib/`, `hooks/`, `types/`, `components/layout/`
- [ ] TanStack Query provider
- [ ] Dashboard, workspace, and document editor pages
- [ ] API routes
- [ ] `.env` template

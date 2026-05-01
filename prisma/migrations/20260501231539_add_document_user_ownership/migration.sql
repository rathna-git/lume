-- Phase 1: DB foundation for Inbox-first pages.
-- Adds direct user ownership (userId), makes workspaceId nullable,
-- adds Smart Workspace Assignment persistence fields, and deletedAt scaffold.

-- Step 1: Add userId as nullable first (required for backfill before NOT NULL).
-- Also add all other new nullable columns in one pass.
ALTER TABLE "Document"
  ADD COLUMN "userId"                            TEXT,
  ADD COLUMN "deletedAt"                         TIMESTAMP(3),
  ADD COLUMN "workspaceSuggestionConfidence"      TEXT,
  ADD COLUMN "workspaceSuggestionContentHash"     TEXT,
  ADD COLUMN "workspaceSuggestionDismissedAt"     TIMESTAMP(3),
  ADD COLUMN "workspaceSuggestionLastTriggeredAt" TIMESTAMP(3),
  ADD COLUMN "workspaceSuggestionReason"          TEXT,
  ADD COLUMN "workspaceSuggestionWorkspaceId"     TEXT;

-- Step 2: Orphan safety check.
-- Abort if any documents reference a workspace that no longer exists.
-- If any orphans exist, fix them before running this migration.
DO $$
DECLARE orphan_count INT;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM "Document" d
  LEFT JOIN "Workspace" w ON d."workspaceId" = w."id"
  WHERE w."id" IS NULL;

  IF orphan_count > 0 THEN
    RAISE EXCEPTION
      'Migration aborted: % orphaned document(s) found whose workspaceId references a non-existent workspace. Fix orphans before running this migration.',
      orphan_count;
  END IF;
END $$;

-- Step 3: Backfill userId from the owning workspace's userId.
UPDATE "Document" d
SET "userId" = w."userId"
FROM "Workspace" w
WHERE d."workspaceId" = w."id";

-- Step 4: Make userId NOT NULL now that all rows are populated.
ALTER TABLE "Document" ALTER COLUMN "userId" SET NOT NULL;

-- Step 5: Make workspaceId nullable (Inbox pages have no workspace).
-- onDelete: Cascade is intentionally preserved — workspace hard-delete still removes documents.
-- TODO(Phase 7): replace with soft-delete / SetNull once Trash is implemented.
ALTER TABLE "Document" ALTER COLUMN "workspaceId" DROP NOT NULL;

-- Step 6: Indexes
CREATE INDEX "Document_userId_idx" ON "Document"("userId");
CREATE INDEX "Document_userId_workspaceId_idx" ON "Document"("userId", "workspaceId");

-- Step 7: Foreign key for userId → User
ALTER TABLE "Document"
  ADD CONSTRAINT "Document_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

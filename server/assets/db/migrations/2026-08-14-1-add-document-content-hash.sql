-- Duplicate detection groups documents by the SHA-256 of their file contents.
-- Both columns are nullable: rows uploaded before this migration are backfilled
-- in the background, and a NULL hash simply means "not scanned yet".
ALTER TABLE documents
  ADD COLUMN content_hash CHAR(64),
  ADD COLUMN size_bytes BIGINT;

-- Serves the unscoped duplicate scan (IDP disabled / admin), which groups by
-- hash across the whole table.
CREATE INDEX IF NOT EXISTS idx_documents_content_hash
  ON documents (content_hash)
  WHERE content_hash IS NOT NULL;

-- Serves the per-owner scan, where grouping happens within a single owner.
CREATE INDEX IF NOT EXISTS idx_documents_owner_content_hash
  ON documents (owner_id, content_hash)
  WHERE content_hash IS NOT NULL;

-- Lets the backfill find unhashed rows without scanning the whole table.
CREATE INDEX IF NOT EXISTS idx_documents_unhashed
  ON documents (id)
  WHERE content_hash IS NULL;

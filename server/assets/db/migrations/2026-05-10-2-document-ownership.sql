INSERT INTO users (id, external_id, email, name)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system',
  NULL,
  'System'
) ON CONFLICT (id) DO NOTHING;

ALTER TABLE documents
  ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN owner_id UUID NOT NULL
    DEFAULT '00000000-0000-0000-0000-000000000000'
    REFERENCES users(id);

ALTER TABLE documents ALTER COLUMN owner_id DROP DEFAULT;

CREATE TABLE document_shares (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (document_id, shared_with_user_id)
);

CREATE INDEX ON document_shares (shared_with_user_id);

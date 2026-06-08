ALTER TABLE collections
  ADD COLUMN owner_id UUID NOT NULL REFERENCES users(id) DEFAULT '00000000-0000-0000-0000-000000000000',
  ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE collection_shares (
  collection_id        UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  shared_with_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_id, shared_with_user_id)
);
CREATE INDEX ON collection_shares (shared_with_user_id);

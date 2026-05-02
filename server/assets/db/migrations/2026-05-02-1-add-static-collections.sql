CREATE TYPE collection_type AS ENUM ('dynamic', 'static');

ALTER TABLE collections
  ADD COLUMN type collection_type NOT NULL DEFAULT 'dynamic';

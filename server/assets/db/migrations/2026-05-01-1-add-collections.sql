
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  filter_expression TEXT NOT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

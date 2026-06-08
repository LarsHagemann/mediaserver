ALTER TABLE documents ADD COLUMN friendly_name TEXT NOT NULL DEFAULT '';
UPDATE documents SET friendly_name = filename WHERE friendly_name = '';

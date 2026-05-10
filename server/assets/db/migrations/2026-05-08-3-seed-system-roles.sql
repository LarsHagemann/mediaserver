-- Seed system roles with their policies and set default idp_config values.
-- Using CTEs to capture generated UUIDs for use in subsequent inserts.

WITH
  admin_role AS (
    INSERT INTO roles (name, description, is_system) VALUES
      ('admin', 'Full access to all features', true)
    RETURNING id
  ),
  editor_role AS (
    INSERT INTO roles (name, description, is_system) VALUES
      ('editor', 'Upload, edit, and view all content', true)
    RETURNING id
  ),
  viewer_role AS (
    INSERT INTO roles (name, description, is_system) VALUES
      ('viewer', 'View all content', true)
    RETURNING id
  ),
  anonymous_role AS (
    INSERT INTO roles (name, description, is_system) VALUES
      ('anonymous', 'Unauthenticated access (no permissions by default)', true)
    RETURNING id
  ),
  admin_policies AS (
    INSERT INTO role_policies (role_id, action)
    SELECT id, unnest(ARRAY[
      'document:read', 'document:upload', 'document:delete',
      'tag:manage',
      'collection:read', 'collection:create', 'collection:update', 'collection:delete',
      'admin:users', 'admin:roles', 'admin:config'
    ])
    FROM admin_role
  ),
  editor_policies AS (
    INSERT INTO role_policies (role_id, action)
    SELECT id, unnest(ARRAY[
      'document:read', 'document:upload', 'document:delete',
      'tag:manage',
      'collection:read', 'collection:create', 'collection:update', 'collection:delete'
    ])
    FROM editor_role
  ),
  viewer_policies AS (
    INSERT INTO role_policies (role_id, action)
    SELECT id, unnest(ARRAY[
      'document:read',
      'collection:read'
    ])
    FROM viewer_role
  ),
  config_defaults AS (
    INSERT INTO idp_config (key, value)
    SELECT 'anonymous_role_id', id FROM anonymous_role
  )
INSERT INTO idp_config (key, value)
SELECT 'default_role_id', id FROM viewer_role;

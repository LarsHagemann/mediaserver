
CREATE OR REPLACE PROCEDURE bulk_edit_documents(
  document_ids uuid[],
  tags_to_add jsonb,
  tags_to_remove jsonb
) AS $$
DECLARE
  tag_ids_to_be_added integer[];
BEGIN
  -- Add tags
  INSERT INTO tags (key, value, type)
  SELECT tag->>'key', tag->>'value', tag->>'type'
  FROM jsonb_array_elements(tags_to_add) AS tag
  ON CONFLICT DO NOTHING;

  -- Update userdata_tags associations
  DELETE FROM userdata_tags
  WHERE userdata_id = ANY(document_ids) AND tag_id IN (
    SELECT id FROM tags
    WHERE (key, value, type) IN (
      SELECT (tag->>'key'), (tag->>'value'), (tag->>'type')
      FROM jsonb_array_elements(tags_to_remove) AS tag
    )
  );

  SELECT array_agg(t.id)
  INTO tag_ids_to_be_added
  FROM tags t
  WHERE EXISTS (
    SELECT 1
    FROM jsonb_array_elements(tags_to_add) AS tag
    WHERE t.key  IS NOT DISTINCT FROM tag->>'key'
      AND t.value IS NOT DISTINCT FROM tag->>'value'
      AND t.type IS NOT DISTINCT FROM tag->>'type'
  );

  INSERT INTO userdata_tags (userdata_id, tag_id)
  SELECT document_id, tag_id
  FROM unnest(document_ids) AS document_id,
       unnest(tag_ids_to_be_added) AS tag_id
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

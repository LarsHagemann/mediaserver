INSERT INTO role_policies (role_id, action)
SELECT r.id, 'admin:state'
FROM roles r
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

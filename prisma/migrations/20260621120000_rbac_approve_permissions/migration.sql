-- RBAC: standardize approve permissions
-- Approve flow exists ONLY for career and alumni modules.
-- Remove obsolete article.publish / event.publish (publish is implicit
-- via update with status=PUBLISHED in those modules).
-- Add new alumni.approve permission.
-- career.approve already exists, keep it.

-- 1. Remove obsolete permissions (and their role mappings first)
DELETE FROM "role_permissions"
WHERE "permission_id" IN (
  SELECT id FROM "permissions" WHERE "name" IN ('article.publish', 'event.publish')
);

DELETE FROM "permissions"
WHERE "name" IN ('article.publish', 'event.publish');

-- 2. Insert alumni.approve (idempotent)
INSERT INTO "permissions" ("name", "description", "module")
SELECT 'alumni.approve', 'Approve alumni registration', 'alumni'
WHERE NOT EXISTS (
  SELECT 1 FROM "permissions" WHERE "name" = 'alumni.approve'
);

-- 3. Grant alumni.approve + career.approve to Superadmin (id=1).
--    Admin (id=2) does NOT get these by default - superadmin must
--    explicitly assign to a designated reviewer role.
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT 1, p.id FROM "permissions" p
WHERE p."name" IN ('alumni.approve', 'career.approve')
  AND NOT EXISTS (
    SELECT 1 FROM "role_permissions" rp
    WHERE rp."role_id" = 1 AND rp."permission_id" = p.id
  );

-- 4. Ensure Admin (id=2) does NOT have approve permissions
DELETE FROM "role_permissions"
WHERE "role_id" = 2
  AND "permission_id" IN (
    SELECT id FROM "permissions"
    WHERE "name" IN ('alumni.approve', 'career.approve', 'article.publish', 'event.publish')
  );

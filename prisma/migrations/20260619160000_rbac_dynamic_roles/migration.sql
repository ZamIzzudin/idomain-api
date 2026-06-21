-- CreateTable: dynamic roles
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: permission catalogue
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "module" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: many-to-many role <-> permission
CREATE TABLE "role_permissions" (
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");
CREATE INDEX "role_permissions_role_id_permission_id_idx" ON "role_permissions"("role_id","permission_id");

-- Seed default roles (Superadmin id=1, Admin id=2 via explicit id)
INSERT INTO "roles" ("id", "name", "slug", "description", "is_system") VALUES
  (1, 'Superadmin', 'superadmin', 'Full system access', true),
  (2, 'Admin',      'admin',      'Content management only', false);

-- Seed permission catalogue grouped by module
INSERT INTO "permissions" ("name", "description", "module") VALUES
  -- user module
  ('user.view',     'View user list',       'user'),
  ('user.create',   'Create new user',      'user'),
  ('user.update',   'Update user',          'user'),
  ('user.delete',   'Delete user',          'user'),
  -- role module
  ('role.view',     'View roles',           'role'),
  ('role.create',   'Create role',          'role'),
  ('role.update',   'Update role',          'role'),
  ('role.delete',   'Delete role',          'role'),
  -- alumni module
  ('alumni.view',     'View alumni',          'alumni'),
  ('alumni.create',   'Create alumni',        'alumni'),
  ('alumni.update',   'Update alumni',        'alumni'),
  ('alumni.delete',   'Delete alumni',        'alumni'),
  -- article module
  ('article.view',    'View articles',        'article'),
  ('article.create',  'Create article',       'article'),
  ('article.update',  'Update article',       'article'),
  ('article.delete',  'Delete article',       'article'),
  ('article.publish', 'Publish article',      'article'),
  -- event module
  ('event.view',      'View events',          'event'),
  ('event.create',    'Create event',         'event'),
  ('event.update',    'Update event',         'event'),
  ('event.delete',    'Delete event',         'event'),
  ('event.publish',   'Publish event',        'event'),
  -- testimonial module
  ('testimonial.view',   'View testimonials',   'testimonial'),
  ('testimonial.create', 'Create testimonial',  'testimonial'),
  ('testimonial.update', 'Update testimonial',  'testimonial'),
  ('testimonial.delete', 'Delete testimonial',  'testimonial'),
  -- career module
  ('career.view',    'View careers',         'career'),
  ('career.create',  'Create career',        'career'),
  ('career.update',  'Update career',        'career'),
  ('career.delete',  'Delete career',        'career'),
  ('career.approve', 'Approve career',       'career'),
  -- category module
  ('category.view',   'View categories',     'category'),
  ('category.create', 'Create category',     'category'),
  ('category.update', 'Update category',     'category'),
  ('category.delete', 'Delete category',     'category'),
  -- setting module
  ('setting.view',   'View settings',        'setting'),
  ('setting.update', 'Update settings',      'setting');

-- Grant ALL permissions to Superadmin (id=1)
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT 1, id FROM "permissions";

-- Grant content-management subset to Admin (id=2): alumni, article, event,
-- testimonial, career, category and read-only setting/user/role view
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT 2, id FROM "permissions"
WHERE "name" IN (
  'alumni.view','alumni.create','alumni.update','alumni.delete',
  'article.view','article.create','article.update','article.delete','article.publish',
  'event.view','event.create','event.update','event.delete','event.publish',
  'testimonial.view','testimonial.create','testimonial.update','testimonial.delete',
  'career.view','career.create','career.update','career.delete','career.approve',
  'category.view','category.create','category.update','category.delete',
  'setting.view','setting.update',
  'user.view','role.view'
);

-- Migrate users.role column -> users.role_id
-- Step 1: add new column (nullable first, will be enforced after backfill)
ALTER TABLE "users" ADD COLUMN "role_id" INTEGER;

-- Step 2: backfill existing rows from the legacy enum column
UPDATE "users" SET "role_id" = CASE
  WHEN "role" = 'SUPERADMIN' THEN 1
  WHEN "role" = 'ADMIN' THEN 2
  ELSE 2
END;

-- Step 3: enforce NOT NULL
ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL;

-- Step 4: set default for future inserts (Admin role)
ALTER TABLE "users" ALTER COLUMN "role_id" SET DEFAULT 2;

-- Step 5: foreign key
ALTER TABLE "users"
  ADD CONSTRAINT "users_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 6: drop legacy column + enum
ALTER TABLE "users" DROP COLUMN "role";
DROP TYPE "UserRole";

-- Reset role / permission id sequences so future manual inserts stay clean
SELECT setval(pg_get_serial_sequence('"' || 'roles' || '"', 'id'),
       (SELECT MAX(id) FROM "roles"));
SELECT setval(pg_get_serial_sequence('"' || 'permissions' || '"', 'id'),
       (SELECT MAX(id) FROM "permissions"));

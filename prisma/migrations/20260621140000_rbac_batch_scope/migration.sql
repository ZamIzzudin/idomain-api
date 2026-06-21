-- CreateTable: RoleBatchScope (batch-level scope for alumni.approve)
CREATE TABLE "role_batch_scopes" (
    "role_id" INTEGER NOT NULL,
    "batch" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_batch_scopes_pkey" PRIMARY KEY ("role_id","batch")
);

-- AddForeignKey
ALTER TABLE "role_batch_scopes"
  ADD CONSTRAINT "role_batch_scopes_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

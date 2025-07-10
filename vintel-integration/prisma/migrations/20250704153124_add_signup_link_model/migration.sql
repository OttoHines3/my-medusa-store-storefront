-- CreateTable
CREATE TABLE "SignupLink" (
    "id" TEXT NOT NULL,
    "zoho_id" TEXT NOT NULL,
    "login_code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "usage_limit" INTEGER NOT NULL DEFAULT 10,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignupLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SignupLink_login_code_key" ON "SignupLink"("login_code");

-- CreateIndex
CREATE INDEX "SignupLink_zoho_id_idx" ON "SignupLink"("zoho_id");

-- CreateIndex
CREATE INDEX "SignupLink_login_code_idx" ON "SignupLink"("login_code");

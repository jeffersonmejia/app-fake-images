-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('READER', 'JOURNALIST');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ImageVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'INCONCLUSIVE', 'UNAVAILABLE', 'NOT_CONFIGURED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'READER',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" UUID NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "summary" VARCHAR(500) NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "author_id" UUID NOT NULL,
    "cover_image_id" UUID,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_assets" (
    "id" UUID NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "storage_key" VARCHAR(100) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" CHAR(64) NOT NULL,
    "uploaded_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_verifications" (
    "id" UUID NOT NULL,
    "image_asset_id" UUID NOT NULL,
    "image_sha256" CHAR(64) NOT NULL,
    "status" "ImageVerificationStatus" NOT NULL,
    "provider" VARCHAR(120),
    "model_version" VARCHAR(120),
    "result" JSONB,
    "latency_ms" INTEGER,
    "checked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "image_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "articles_cover_image_id_key" ON "articles"("cover_image_id");

-- CreateIndex
CREATE INDEX "articles_status_published_at_idx" ON "articles"("status", "published_at");

-- CreateIndex
CREATE INDEX "articles_author_id_updated_at_idx" ON "articles"("author_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "image_assets_storage_key_key" ON "image_assets"("storage_key");

-- CreateIndex
CREATE INDEX "image_assets_uploaded_by_id_created_at_idx" ON "image_assets"("uploaded_by_id", "created_at");

-- CreateIndex
CREATE INDEX "image_assets_sha256_idx" ON "image_assets"("sha256");

-- CreateIndex
CREATE INDEX "image_verifications_status_created_at_idx" ON "image_verifications"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "image_verifications_image_asset_id_image_sha256_key" ON "image_verifications"("image_asset_id", "image_sha256");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_cover_image_id_fkey" FOREIGN KEY ("cover_image_id") REFERENCES "image_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_assets" ADD CONSTRAINT "image_assets_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_verifications" ADD CONSTRAINT "image_verifications_image_asset_id_fkey" FOREIGN KEY ("image_asset_id") REFERENCES "image_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migration: Create facebook_integrations table for FacebookIntegration model
CREATE TABLE IF NOT EXISTS "facebook_integrations" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "fb_page_id" VARCHAR(255) NOT NULL,
  "fb_page_name" VARCHAR(255) NOT NULL,
  "fb_form_id" VARCHAR(255) NOT NULL,
  "fb_form_name" VARCHAR(255) NOT NULL,
  "access_token" TEXT NOT NULL,
  "status" VARCHAR(20) DEFAULT 'inactive',
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

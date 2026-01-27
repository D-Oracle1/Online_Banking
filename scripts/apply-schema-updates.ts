import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function applySchemaUpdates() {
  try {
    console.log('Creating audit_logs table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "action" varchar(100) NOT NULL,
        "entity_type" varchar(50) NOT NULL,
        "entity_id" text,
        "details" text,
        "ip_address" varchar(50),
        "user_agent" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    console.log('Adding new columns to site_settings...');

    // Background Colors
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "background_light" varchar(7) DEFAULT '#ffffff' NOT NULL;`);
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "background_dark" varchar(7) DEFAULT '#f9fafb' NOT NULL;`);

    // Text Colors
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "text_primary" varchar(7) DEFAULT '#111827' NOT NULL;`);
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "text_secondary" varchar(7) DEFAULT '#6b7280' NOT NULL;`);
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "text_muted" varchar(7) DEFAULT '#9ca3af' NOT NULL;`);

    // Button Colors
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "button_primary" varchar(7) DEFAULT '#1e3a8a' NOT NULL;`);
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "button_secondary" varchar(7) DEFAULT '#64748b' NOT NULL;`);
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "button_success" varchar(7) DEFAULT '#10b981' NOT NULL;`);
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "button_warning" varchar(7) DEFAULT '#f59e0b' NOT NULL;`);
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "button_danger" varchar(7) DEFAULT '#ef4444' NOT NULL;`);

    // Border & UI Colors
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "border_color" varchar(7) DEFAULT '#e5e7eb' NOT NULL;`);
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "shadow_color" varchar(7) DEFAULT '#000000' NOT NULL;`);

    // Site Information
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "tagline" text;`);
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "support_email" varchar(200);`);
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "support_phone" varchar(50);`);

    // System Settings
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "maintenance_mode" boolean DEFAULT false NOT NULL;`);
    await db.execute(sql`ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "registration_enabled" boolean DEFAULT true NOT NULL;`);

    // Add foreign key for audit_logs
    console.log('Adding foreign key constraint for audit_logs...');
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('Schema updates applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error applying schema updates:', error);
    process.exit(1);
  }
}

applySchemaUpdates();

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
--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "background_light" varchar(7) DEFAULT '#ffffff' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "background_dark" varchar(7) DEFAULT '#f9fafb' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "text_primary" varchar(7) DEFAULT '#111827' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "text_secondary" varchar(7) DEFAULT '#6b7280' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "text_muted" varchar(7) DEFAULT '#9ca3af' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "button_primary" varchar(7) DEFAULT '#1e3a8a' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "button_secondary" varchar(7) DEFAULT '#64748b' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "button_success" varchar(7) DEFAULT '#10b981' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "button_warning" varchar(7) DEFAULT '#f59e0b' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "button_danger" varchar(7) DEFAULT '#ef4444' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "border_color" varchar(7) DEFAULT '#e5e7eb' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "shadow_color" varchar(7) DEFAULT '#000000' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "tagline" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "support_email" varchar(200);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "support_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "maintenance_mode" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "registration_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

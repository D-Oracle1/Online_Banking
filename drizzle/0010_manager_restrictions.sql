ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_manager" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "assigned_manager_id" text;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_restrictions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"restriction_code" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"cleared_at" timestamp,
	"cleared_by" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_restrictions" ADD CONSTRAINT "user_restrictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_restrictions" ADD CONSTRAINT "user_restrictions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

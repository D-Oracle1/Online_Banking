CREATE TABLE IF NOT EXISTS "pending_registrations" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"phone_number" varchar(20),
	"date_of_birth" date,
	"gender" varchar(10),
	"nationality" varchar(50),
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"postal_code" varchar(20),
	"country" varchar(100),
	"occupation" varchar(100),
	"employer" varchar(200),
	"annual_income" varchar(50),
	"profile_photo" text,
	"email_otp" varchar(10) NOT NULL,
	"otp_expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "pending_registrations_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "sender_type" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "sent_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_active_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_typing" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "aml_code" varchar(10);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "aml_code_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_fa_code" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_fa_code_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "unlock_code" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "unlock_code_expires_at" timestamp;
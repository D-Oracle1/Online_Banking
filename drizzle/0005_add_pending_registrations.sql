-- Create pending_registrations table
CREATE TABLE IF NOT EXISTS "pending_registrations" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL UNIQUE,
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
	"expires_at" timestamp NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS "pending_registrations_email_idx" ON "pending_registrations" ("email");

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS "pending_registrations_expires_at_idx" ON "pending_registrations" ("expires_at");

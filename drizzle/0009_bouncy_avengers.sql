CREATE TABLE IF NOT EXISTS "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_holdings" (
	"id" text PRIMARY KEY NOT NULL,
	"portfolio_id" text NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"shares" numeric(15, 6) NOT NULL,
	"average_purchase_price" numeric(15, 2) NOT NULL,
	"total_invested" numeric(15, 2) NOT NULL,
	"current_price" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"current_value" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"profit_loss" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"profit_loss_percent" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_portfolios" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"total_invested" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"current_value" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"total_profit_loss" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"portfolio_id" text NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"type" varchar(10) NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"shares" numeric(15, 6) NOT NULL,
	"price_per_share" numeric(15, 2) NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'SUCCESS' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_watchlist" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"added_price" numeric(15, 2) NOT NULL,
	"current_price" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"price_change" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"price_change_percent" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" text
);
--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "splash_logo_url" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "app_icon_url" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "copyright_text" varchar(500);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "facebook_url" varchar(500);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "twitter_url" varchar(500);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "instagram_url" varchar(500);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "linkedin_url" varchar(500);--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "whatsapp_number" varchar(50);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_holdings" ADD CONSTRAINT "stock_holdings_portfolio_id_stock_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."stock_portfolios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_portfolios" ADD CONSTRAINT "stock_portfolios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_portfolio_id_stock_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."stock_portfolios"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_watchlist" ADD CONSTRAINT "stock_watchlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

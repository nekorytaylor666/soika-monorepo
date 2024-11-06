CREATE TABLE IF NOT EXISTS "boards" (
	"id" uuid PRIMARY KEY NOT NULL,
	"board_owner" uuid,
	"name" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "boards_statuses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"board_id" integer,
	"status" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deal_board" (
	"id" uuid PRIMARY KEY NOT NULL,
	"deal_id" uuid,
	"status_id" uuid,
	"board_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lot_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lots" (
	"id" serial PRIMARY KEY NOT NULL,
	"tender_id" integer,
	"purchase_number" text,
	"purchase_name" text,
	"lot_number" text,
	"lot_name" text,
	"lot_description" text,
	"lot_additional_description" text,
	"quantity" double precision,
	"unit_of_measure" text,
	"delivery_places" text,
	"delivery_term" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plagiarism_check" (
	"id" serial PRIMARY KEY NOT NULL,
	"lot_id" integer,
	"unique" double precision,
	"urls" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"image" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recommended_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"lot_id" integer,
	"product_name" text,
	"product_description" text,
	"product_specifications" text,
	"source_url" text,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenders" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_number" text,
	"name" text,
	"status" text,
	"application_start_date" text,
	"application_end_date" text,
	"budget" double precision
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "boards" ADD CONSTRAINT "boards_board_owner_profile_id_fk" FOREIGN KEY ("board_owner") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "boards_statuses" ADD CONSTRAINT "boards_statuses_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deal_board" ADD CONSTRAINT "deal_board_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deal_board" ADD CONSTRAINT "deal_board_status_id_boards_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."boards_statuses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deal_board" ADD CONSTRAINT "deal_board_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deals" ADD CONSTRAINT "deals_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deals" ADD CONSTRAINT "deals_created_by_profile_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lots" ADD CONSTRAINT "lots_tender_id_tenders_id_fk" FOREIGN KEY ("tender_id") REFERENCES "public"."tenders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "plagiarism_check" ADD CONSTRAINT "plagiarism_check_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile" ADD CONSTRAINT "profile_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recommended_products" ADD CONSTRAINT "recommended_products_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

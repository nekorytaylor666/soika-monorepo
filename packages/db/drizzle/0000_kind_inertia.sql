DO $$ BEGIN
 CREATE TYPE "public"."schedule_frequency" AS ENUM('daily', 'weekly', 'monthly');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."task_status" AS ENUM('not_started', 'in_progress', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_owner" uuid,
	"name" text,
	"organization_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "boards_statuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" uuid,
	"status" text,
	"order" integer,
	"is_archived" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contracts" (
	"id" text,
	"contract_sum" text NOT NULL,
	"fakt_sum" text NOT NULL,
	"supplier_bik" text,
	"supplier_biin" text,
	"supplier_id" integer,
	"customer_bik" text,
	"description_ru" text,
	"customer_bin" text,
	"technical_specification" text,
	"contract_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"local_content_projected_share" double precision,
	"tru_history" jsonb,
	"ref_subject_type" jsonb,
	"ref_contract_status" jsonb,
	"trd_buy" jsonb,
	"contract_unit" jsonb,
	"lot" jsonb,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"system_id" integer,
	"bin" text,
	"iin" text,
	"name_ru" text NOT NULL,
	"full_name_ru" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deal_board" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid,
	"status_id" uuid DEFAULT 'd4fe1764-18e8-4322-a833-f0b25a498989'::uuid,
	"board_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deal_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid,
	"name" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"is_completed" boolean DEFAULT false,
	"is_archived" boolean DEFAULT false,
	"completed_at" timestamp,
	"completed_by" uuid,
	"assigned_to" uuid,
	"assigned_at" timestamp DEFAULT now(),
	"assigned_by" uuid,
	"due_date" timestamp,
	"status" "task_status" DEFAULT 'not_started' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lot_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"organization_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "goszakup_contracts" (
	"id" text,
	"contract_sum" text NOT NULL,
	"fakt_sum" text NOT NULL,
	"supplier_bik" text,
	"supplier_biin" text,
	"supplier_id" integer,
	"customer_bik" text,
	"description_ru" text,
	"customer_bin" text,
	"technical_specification" text,
	"contract_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"local_content_projected_share" double precision,
	"tru_history" jsonb,
	"ref_subject_type" jsonb,
	"ref_contract_status" jsonb,
	"trd_buy" jsonb,
	"contract_unit" jsonb,
	"lot" jsonb,
	"embedding" vector(1536),
	"contractms" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lots" (
	"id" integer PRIMARY KEY NOT NULL,
	"tender_id" integer,
	"purchase_number" text,
	"purchase_name" text,
	"lot_number" text NOT NULL,
	"lot_name" text,
	"lot_description" text,
	"lot_additional_description" text,
	"quantity" double precision,
	"unit_of_measure" text,
	"budget" double precision,
	"delivery_places" text,
	"lot_specifications" text,
	"delivery_term" text,
	"consulting_services" integer,
	"customer_id" integer,
	"customer_bin" text,
	"customer_name_ru" text,
	"enstru_list" integer[] DEFAULT ARRAY[]::int[] NOT NULL,
	"trd_buy_number_anno" text,
	"ref_lots_status" jsonb,
	"count" integer,
	"index_date" text,
	"ref_trade_methods" jsonb,
	"pln_point_kato_list" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"files" jsonb,
	"files_with_text" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"embedding" vector(1536),
	"fts" "tsvector"
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" uuid NOT NULL,
	"new_reports" boolean DEFAULT true,
	"new_recommendations" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "onboarding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"completed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"invited_by_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"allow_member_invites" boolean DEFAULT false,
	"default_member_role" text DEFAULT 'member'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bin" text NOT NULL,
	"name" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_contracts_ingested" boolean DEFAULT false,
	CONSTRAINT "organizations_bin_unique" UNIQUE("bin")
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
CREATE TABLE IF NOT EXISTS "recommended_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"organization_id" uuid,
	"results" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recommended_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"lot_id" integer,
	"product_name" text,
	"product_description" text,
	"product_specifications" text,
	"source_url" text,
	"price" double precision,
	"unit_of_measure" text,
	"currency" text,
	"image_url" text,
	"compliance_score" integer,
	"compliance_details" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "samruk_contracts" (
	"id" text PRIMARY KEY NOT NULL,
	"contract_sum" text NOT NULL,
	"supplier_biin" text,
	"supplier_id" text,
	"customer_bin" text,
	"description_ru" text,
	"contract_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"local_content_projected_share" double precision,
	"technical_specification" text,
	"system_number" text,
	"contract_card_status" text,
	"advert_number" text,
	"tru_history" jsonb,
	"lot" jsonb,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedule_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"organization_id" uuid,
	"schedule_id" uuid,
	"result" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"query" text NOT NULL,
	"filters" jsonb,
	"frequency" "schedule_frequency" DEFAULT 'daily',
	"organization_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "suppliers" (
	"id" integer PRIMARY KEY NOT NULL,
	"bin" text,
	"name_ru" text NOT NULL,
	"iin" text,
	"full_name_ru" text,
	"system_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" uuid NOT NULL,
	"telegram_id" text NOT NULL,
	"chat_id" text NOT NULL,
	"username" text,
	"first_name" text,
	"last_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_users_telegram_id_unique" UNIQUE("telegram_id")
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
CREATE TABLE IF NOT EXISTS "trade_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "trade_methods_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "boards" ADD CONSTRAINT "boards_board_owner_profile_id_fk" FOREIGN KEY ("board_owner") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "boards" ADD CONSTRAINT "boards_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "deal_tasks" ADD CONSTRAINT "deal_tasks_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deal_tasks" ADD CONSTRAINT "deal_tasks_created_by_profile_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deal_tasks" ADD CONSTRAINT "deal_tasks_completed_by_profile_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deal_tasks" ADD CONSTRAINT "deal_tasks_assigned_to_profile_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "deal_tasks" ADD CONSTRAINT "deal_tasks_assigned_by_profile_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "deals" ADD CONSTRAINT "deals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "onboarding" ADD CONSTRAINT "onboarding_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_activity_log" ADD CONSTRAINT "organization_activity_log_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_activity_log" ADD CONSTRAINT "organization_activity_log_actor_id_profile_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_invited_by_id_profile_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_profile_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "plagiarism_check" ADD CONSTRAINT "plagiarism_check_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recommended_lots" ADD CONSTRAINT "recommended_lots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recommended_products" ADD CONSTRAINT "recommended_products_lot_id_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."lots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_results" ADD CONSTRAINT "schedule_results_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_results" ADD CONSTRAINT "schedule_results_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_created_by_profile_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_users" ADD CONSTRAINT "telegram_users_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lots_fts" ON "lots" USING gin ("fts");
CREATE TYPE "public"."user_role" AS ENUM('admin', 'staff', 'accountant', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TABLE "state" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mode_of_project" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_state" (
	"project" uuid,
	"state" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "project_state_project_state_pk" PRIMARY KEY("project","state")
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" varchar NOT NULL,
	"mode_of_project" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bill_category" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gst_percentage_applicable" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"label" varchar,
	"value" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoice_status_history" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"from_status" uuid,
	"to_status" uuid NOT NULL,
	"changed_by" uuid,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "status" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"created_by" uuid NOT NULL,
	"project" uuid NOT NULL,
	"bill_category" uuid,
	"milestone" uuid,
	"state" uuid,
	"status" uuid NOT NULL,
	"gst_percentage_id" uuid,
	"invoice_number" varchar NOT NULL,
	"invoice_date" date NOT NULL,
	"submission_date" date,
	"basic_amount" numeric(15, 2) NOT NULL,
	"gst_amount" numeric(15, 2) NOT NULL,
	"total_amount" numeric(15, 2) NOT NULL,
	"passed_amount_by_client" numeric(15, 2),
	"retention" numeric(15, 2),
	"gst_withheld" numeric(15, 2),
	"tds" numeric(15, 2),
	"gst_tds" numeric(15, 2),
	"bocw" numeric(15, 2),
	"low_depth_deduction" numeric(15, 2),
	"ld" numeric(15, 2),
	"sla_penalty" numeric(15, 2),
	"penalty" numeric(15, 2),
	"other_deduction" numeric(15, 2),
	"total_deduction" numeric(15, 2),
	"net_payable" numeric(15, 2),
	"amount_paid_by_client" numeric(15, 2),
	"payment_date" date,
	"balance_pending_amount" numeric(15, 2),
	"remarks" text,
	"invoice_copy" varchar(1024) NOT NULL,
	"proof_of_submission" varchar(1024) NOT NULL,
	"supporting_documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "chk_invoice_basic_amount_nonneg" CHECK ("invoice"."basic_amount" >= 0),
	CONSTRAINT "chk_invoice_gst_amount_nonneg" CHECK ("invoice"."gst_amount" >= 0),
	CONSTRAINT "chk_invoice_total_amount_nonneg" CHECK ("invoice"."total_amount" >= 0),
	CONSTRAINT "chk_invoice_passed_amount_nonneg" CHECK ("invoice"."passed_amount_by_client" IS NULL OR "invoice"."passed_amount_by_client" >= 0),
	CONSTRAINT "chk_invoice_retention_nonneg" CHECK ("invoice"."retention" IS NULL OR "invoice"."retention" >= 0),
	CONSTRAINT "chk_invoice_gst_withheld_nonneg" CHECK ("invoice"."gst_withheld" IS NULL OR "invoice"."gst_withheld" >= 0),
	CONSTRAINT "chk_invoice_tds_nonneg" CHECK ("invoice"."tds" IS NULL OR "invoice"."tds" >= 0),
	CONSTRAINT "chk_invoice_gst_tds_nonneg" CHECK ("invoice"."gst_tds" IS NULL OR "invoice"."gst_tds" >= 0),
	CONSTRAINT "chk_invoice_bocw_nonneg" CHECK ("invoice"."bocw" IS NULL OR "invoice"."bocw" >= 0),
	CONSTRAINT "chk_invoice_low_depth_nonneg" CHECK ("invoice"."low_depth_deduction" IS NULL OR "invoice"."low_depth_deduction" >= 0),
	CONSTRAINT "chk_invoice_ld_nonneg" CHECK ("invoice"."ld" IS NULL OR "invoice"."ld" >= 0),
	CONSTRAINT "chk_invoice_sla_penalty_nonneg" CHECK ("invoice"."sla_penalty" IS NULL OR "invoice"."sla_penalty" >= 0),
	CONSTRAINT "chk_invoice_penalty_nonneg" CHECK ("invoice"."penalty" IS NULL OR "invoice"."penalty" >= 0),
	CONSTRAINT "chk_invoice_other_deduction_nonneg" CHECK ("invoice"."other_deduction" IS NULL OR "invoice"."other_deduction" >= 0),
	CONSTRAINT "chk_invoice_total_deduction_nonneg" CHECK ("invoice"."total_deduction" IS NULL OR "invoice"."total_deduction" >= 0),
	CONSTRAINT "chk_invoice_net_payable_nonneg" CHECK ("invoice"."net_payable" IS NULL OR "invoice"."net_payable" >= 0),
	CONSTRAINT "chk_invoice_amount_paid_nonneg" CHECK ("invoice"."amount_paid_by_client" IS NULL OR "invoice"."amount_paid_by_client" >= 0),
	CONSTRAINT "chk_invoice_balance_pending_nonneg" CHECK ("invoice"."balance_pending_amount" IS NULL OR "invoice"."balance_pending_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "milestone" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_credentials" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"password_hash" text NOT NULL,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_emails" (
	"email" varchar(100) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_token" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"project_id" uuid,
	"role" "user_role" DEFAULT 'other' NOT NULL,
	"full_name" varchar(120) NOT NULL,
	"user_photo_url" varchar(1024),
	"date_of_birth" date,
	"user_notes" text,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_state" ADD CONSTRAINT "project_state_project_project_id_fk" FOREIGN KEY ("project") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_state" ADD CONSTRAINT "project_state_state_state_id_fk" FOREIGN KEY ("state") REFERENCES "public"."state"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_mode_of_project_mode_of_project_id_fk" FOREIGN KEY ("mode_of_project") REFERENCES "public"."mode_of_project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_status_history" ADD CONSTRAINT "invoice_status_history_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_status_history" ADD CONSTRAINT "invoice_status_history_from_status_status_id_fk" FOREIGN KEY ("from_status") REFERENCES "public"."status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_status_history" ADD CONSTRAINT "invoice_status_history_to_status_status_id_fk" FOREIGN KEY ("to_status") REFERENCES "public"."status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_project_project_id_fk" FOREIGN KEY ("project") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_bill_category_bill_category_id_fk" FOREIGN KEY ("bill_category") REFERENCES "public"."bill_category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_milestone_milestone_id_fk" FOREIGN KEY ("milestone") REFERENCES "public"."milestone"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_state_state_id_fk" FOREIGN KEY ("state") REFERENCES "public"."state"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_status_status_id_fk" FOREIGN KEY ("status") REFERENCES "public"."status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_gst_percentage_id_gst_percentage_applicable_id_fk" FOREIGN KEY ("gst_percentage_id") REFERENCES "public"."gst_percentage_applicable"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_emails" ADD CONSTRAINT "user_emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_primary_email_per_user" ON "user_emails" USING btree ("user_id","is_primary") WHERE "user_emails"."is_primary" = true;
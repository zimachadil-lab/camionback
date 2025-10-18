CREATE TABLE "admin_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commission_percentage" numeric(5, 2) DEFAULT '10',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"receiver_id" varchar NOT NULL,
	"message" text NOT NULL,
	"filtered_message" text,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"related_id" varchar,
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" varchar NOT NULL,
	"transporter_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"message" text,
	"status" text DEFAULT 'pending',
	"payment_proof_url" text,
	"payment_validated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transport_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_id" text NOT NULL,
	"client_id" varchar NOT NULL,
	"from_city" text NOT NULL,
	"to_city" text NOT NULL,
	"description" text NOT NULL,
	"goods_type" text NOT NULL,
	"estimated_weight" text,
	"date_time" timestamp NOT NULL,
	"budget" numeric(10, 2),
	"photos" text[],
	"status" text DEFAULT 'open',
	"accepted_offer_id" varchar,
	"payment_status" text DEFAULT 'pending',
	"payment_receipt" text,
	"payment_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "transport_requests_reference_id_unique" UNIQUE("reference_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text,
	"name" text,
	"city" text,
	"truck_photos" text[],
	"rating" numeric(3, 2) DEFAULT '0',
	"total_ratings" integer DEFAULT 0,
	"total_trips" integer DEFAULT 0,
	"status" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_request_id_transport_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."transport_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_request_id_transport_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."transport_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_transporter_id_users_id_fk" FOREIGN KEY ("transporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_requests" ADD CONSTRAINT "transport_requests_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
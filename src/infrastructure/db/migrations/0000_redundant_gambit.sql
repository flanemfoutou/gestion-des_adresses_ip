DO $$ BEGIN
 CREATE TYPE "public"."access_point_status" AS ENUM('online', 'offline', 'maintenance');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'assign', 'release', 'reserve');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."base_status" AS ENUM('active', 'inactive', 'maintenance');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."client_type" AS ENUM('residential', 'business', 'enterprise', 'iot');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."ip_address_status" AS ENUM('free', 'occupied', 'reserved', 'decommissioned');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."ip_assignment_status" AS ENUM('assigned', 'released', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."ip_usage_type" AS ENUM('client', 'management', 'infrastructure');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."signal_quality" AS ENUM('excellent', 'good', 'fair', 'poor', 'critical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "access_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"management_ip_id" uuid NOT NULL,
	"base_id" uuid NOT NULL,
	"sector" varchar(64) NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"altitude" numeric(7, 2),
	"azimuth" numeric(5, 2),
	"tilt" numeric(5, 2),
	"beamwidth" numeric(5, 2),
	"status" "access_point_status" DEFAULT 'online' NOT NULL,
	"deleted_at" timestamp DEFAULT null,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity" varchar(64) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" "audit_action" NOT NULL,
	"payload" text NOT NULL,
	"performed_by" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"location" varchar(128) NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"altitude" numeric(7, 2),
	"status" "base_status" DEFAULT 'active' NOT NULL,
	"deleted_at" timestamp DEFAULT null,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(128) NOT NULL,
	"phone_number" varchar(32) NOT NULL,
	"client_type" "client_type" DEFAULT 'residential' NOT NULL,
	"access_point_id" uuid NOT NULL,
	"deleted_at" timestamp DEFAULT null,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cpe_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"access_point_id" uuid NOT NULL,
	"model" varchar(128) NOT NULL,
	"mac_address" varchar(32) NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"altitude" numeric(7, 2),
	"azimuth" numeric(5, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ip_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar(64) NOT NULL,
	"status" "ip_address_status" DEFAULT 'free' NOT NULL,
	"usage_type" "ip_usage_type" DEFAULT 'client' NOT NULL,
	"reserved" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"network_id" uuid NOT NULL,
	"deleted_at" timestamp DEFAULT null,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ip_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_address_id" uuid NOT NULL,
	"client_id" uuid,
	"access_point_id" uuid NOT NULL,
	"status" "ip_assignment_status" DEFAULT 'assigned' NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"released_at" timestamp DEFAULT null,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "networks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cidr" varchar(32) NOT NULL,
	"network_address" varchar(64) NOT NULL,
	"broadcast_address" varchar(64) NOT NULL,
	"subnet_mask" varchar(64) NOT NULL,
	"wildcard_mask" varchar(64) NOT NULL,
	"usable_start" varchar(64) NOT NULL,
	"usable_end" varchar(64) NOT NULL,
	"total_hosts" integer NOT NULL,
	"prefix" integer NOT NULL,
	"is_private" boolean NOT NULL,
	"gateway" varchar(64) NOT NULL,
	"vlan" integer NOT NULL,
	"access_point_id" uuid NOT NULL,
	"deleted_at" timestamp DEFAULT null,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "signal_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cpe_id" uuid NOT NULL,
	"access_point_id" uuid NOT NULL,
	"rssi" numeric(6, 2) NOT NULL,
	"snr" numeric(6, 2),
	"tx_power" numeric(6, 2),
	"rx_power" numeric(6, 2),
	"link_quality" numeric(5, 2),
	"quality" "signal_quality" NOT NULL,
	"distance" numeric(10, 2),
	"measured_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "access_points_management_ip_id_unique" ON "access_points" USING btree ("management_ip_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "access_points_base_id_index" ON "access_points" USING btree ("base_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clients_access_point_id_index" ON "clients" USING btree ("access_point_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cpe_devices_client_id_index" ON "cpe_devices" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cpe_devices_access_point_id_index" ON "cpe_devices" USING btree ("access_point_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cpe_devices_mac_address_unique" ON "cpe_devices" USING btree ("mac_address");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ip_addresses_address_unique" ON "ip_addresses" USING btree ("address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ip_addresses_network_id_index" ON "ip_addresses" USING btree ("network_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ip_assignments_ip_address_id_index" ON "ip_assignments" USING btree ("ip_address_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ip_assignments_client_id_index" ON "ip_assignments" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "networks_access_point_id_index" ON "networks" USING btree ("access_point_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "networks_cidr_unique" ON "networks" USING btree ("cidr");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "signal_metrics_cpe_id_index" ON "signal_metrics" USING btree ("cpe_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "signal_metrics_ap_id_index" ON "signal_metrics" USING btree ("access_point_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "signal_metrics_measured_at_index" ON "signal_metrics" USING btree ("measured_at");
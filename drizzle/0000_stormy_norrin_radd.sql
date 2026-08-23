CREATE TABLE `content_licenses` (
	`id` text PRIMARY KEY NOT NULL,
	`scene_id` text NOT NULL,
	`licensor_name` text NOT NULL,
	`territory` text NOT NULL,
	`usage_starts_at` text NOT NULL,
	`usage_ends_at` text,
	`proof_object_key` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`scene_id`) REFERENCES `scenes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_content_licenses_scene_id` ON `content_licenses` (`scene_id`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`scene_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`scene_id`) REFERENCES `scenes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_roles_scene_id` ON `roles` (`scene_id`);--> statement-breakpoint
CREATE TABLE `scenes` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`source_title` text NOT NULL,
	`source_type` text NOT NULL,
	`synopsis` text NOT NULL,
	`genre` text NOT NULL,
	`age_rating` text NOT NULL,
	`challenge_date` text NOT NULL,
	`duration_ms` integer NOT NULL,
	`video_object_key` text,
	`preview_image_object_key` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_scenes_slug` ON `scenes` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_scenes_challenge_date` ON `scenes` (`challenge_date`);--> statement-breakpoint
CREATE TABLE `script_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`scene_id` text NOT NULL,
	`role_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`start_ms` integer NOT NULL,
	`end_ms` integer NOT NULL,
	`text` text NOT NULL,
	`direction` text,
	FOREIGN KEY (`scene_id`) REFERENCES `scenes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_script_lines_scene_sequence` ON `script_lines` (`scene_id`,`sequence`);--> statement-breakpoint
PRAGMA optimize;

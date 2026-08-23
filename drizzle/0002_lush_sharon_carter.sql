CREATE TABLE `game_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`host_user_id` text NOT NULL,
	`mode` text DEFAULT 'classic' NOT NULL,
	`status` text DEFAULT 'lobby' NOT NULL,
	`current_round` integer DEFAULT 0 NOT NULL,
	`total_rounds` integer DEFAULT 5 NOT NULL,
	`max_players` integer DEFAULT 8 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`host_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_game_rooms_code` ON `game_rooms` (`code`);--> statement-breakpoint
CREATE INDEX `idx_game_rooms_status` ON `game_rooms` (`status`);--> statement-breakpoint
CREATE TABLE `game_rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`round_number` integer NOT NULL,
	`scene_slug` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `game_rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_game_rounds_room_number` ON `game_rounds` (`room_id`,`round_number`);--> statement-breakpoint
CREATE INDEX `idx_game_rounds_room_status` ON `game_rounds` (`room_id`,`status`);--> statement-breakpoint
CREATE TABLE `room_players` (
	`room_id` text NOT NULL,
	`user_id` text NOT NULL,
	`seat` integer NOT NULL,
	`joined_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`room_id`, `user_id`),
	FOREIGN KEY (`room_id`) REFERENCES `game_rooms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_room_players_seat` ON `room_players` (`room_id`,`seat`);--> statement-breakpoint
CREATE INDEX `idx_room_players_user` ON `room_players` (`user_id`);--> statement-breakpoint
CREATE TABLE `round_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`round_id` text NOT NULL,
	`user_id` text NOT NULL,
	`audio_object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`duration_ms` integer NOT NULL,
	`submitted_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`round_id`) REFERENCES `game_rounds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_round_submissions_round_user` ON `round_submissions` (`round_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_round_submissions_object` ON `round_submissions` (`audio_object_key`);--> statement-breakpoint
CREATE INDEX `idx_round_submissions_round_time` ON `round_submissions` (`round_id`,`submitted_at`);
CREATE TABLE `accounts` (
	`user` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `members` ADD `driver_id` text DEFAULT 'drupa' NOT NULL;
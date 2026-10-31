CREATE TABLE `cups` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner` text NOT NULL,
	`round` integer DEFAULT 0 NOT NULL,
	`rounds` integer DEFAULT 3 NOT NULL,
	`start` integer DEFAULT 0 NOT NULL,
	`created` integer NOT NULL
);

--> statement-breakpoint
CREATE TABLE `members` (
	`cup` text NOT NULL,
	`user` text NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`x` real DEFAULT 0 NOT NULL,
	`y` real DEFAULT 0 NOT NULL,
	`angle` real DEFAULT 0 NOT NULL,
	`progress` real DEFAULT 0 NOT NULL,
	`updated` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`cup`, `user`)
);

--> statement-breakpoint
CREATE TABLE `results` (
	`cup` text NOT NULL,
	`user` text NOT NULL,
	`round` integer NOT NULL,
	`elapsed` integer NOT NULL,
	PRIMARY KEY(`cup`, `user`, `round`)
);

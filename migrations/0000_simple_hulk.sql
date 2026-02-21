CREATE TABLE `Customers` (
	`CustomerId` integer PRIMARY KEY NOT NULL,
	`CompanyName` text NOT NULL,
	`ContactName` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `linkShare` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`remark` text,
	`created` integer NOT NULL,
	`modified` integer NOT NULL,
	`deleted` integer
);

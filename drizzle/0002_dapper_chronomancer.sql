ALTER TABLE `users` ADD `area` varchar(120);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `interests` text;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompleted` tinyint DEFAULT 0 NOT NULL;
CREATE TABLE `follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerId` int NOT NULL,
	`followingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `follows_id` PRIMARY KEY(`id`),
	CONSTRAINT `follows_follower_following_unique` UNIQUE(`followerId`,`followingId`)
);
--> statement-breakpoint
CREATE TABLE `friendRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requesterId` int NOT NULL,
	`addresseeId` int NOT NULL,
	`status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `friendRequests_id` PRIMARY KEY(`id`),
	CONSTRAINT `friend_requests_requester_addressee_unique` UNIQUE(`requesterId`,`addresseeId`)
);

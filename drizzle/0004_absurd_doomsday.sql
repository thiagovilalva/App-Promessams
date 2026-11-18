CREATE TABLE `site_analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorId` varchar(64) NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`eventType` enum('session_start','page_view','heartbeat','session_end') NOT NULL,
	`platform` enum('web','app') NOT NULL,
	`path` varchar(255) NOT NULL,
	`feature` varchar(80) NOT NULL,
	`durationSeconds` int NOT NULL DEFAULT 0,
	`referrer` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `site_analytics_created_at_idx` ON `site_analytics_events` (`createdAt`);--> statement-breakpoint
CREATE INDEX `site_analytics_session_idx` ON `site_analytics_events` (`sessionId`);--> statement-breakpoint
CREATE INDEX `site_analytics_visitor_idx` ON `site_analytics_events` (`visitorId`);--> statement-breakpoint
CREATE INDEX `site_analytics_platform_idx` ON `site_analytics_events` (`platform`,`createdAt`);
ALTER TABLE `materials` ADD `category` varchar(64) DEFAULT 'outros' NOT NULL;--> statement-breakpoint
ALTER TABLE `materials` ADD `version` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `materials` ADD `assetUrl` varchar(1024);--> statement-breakpoint
ALTER TABLE `materials` ADD `assetName` varchar(255);--> statement-breakpoint
ALTER TABLE `materials` ADD `assetMimeType` varchar(160);--> statement-breakpoint
ALTER TABLE `materials` ADD `assetSize` int;
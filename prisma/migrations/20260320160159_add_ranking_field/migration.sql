-- CreateTable
CREATE TABLE `RankingItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rankingType` ENUM('TREND', 'HOT', 'BEST') NOT NULL,
    `postId` INTEGER NOT NULL,
    `score` DOUBLE NOT NULL,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RankingItem_rankingType_postId_key`(`rankingType`, `postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RankingItem` ADD CONSTRAINT `RankingItem_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

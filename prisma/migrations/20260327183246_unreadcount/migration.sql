-- AlterTable
ALTER TABLE `chatparticipant` ADD COLUMN `unreadCount` INTEGER NOT NULL DEFAULT 0;

-- RenameIndex
ALTER TABLE `chatparticipant` RENAME INDEX `ChatParticipant_userId_fkey` TO `ChatParticipant_userId_idx`;

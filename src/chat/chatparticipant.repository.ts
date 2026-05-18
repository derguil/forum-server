import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';
import { DbClient } from '../infra/prisma/prisma.DbClientType';

const chatParticipantSelect = {
	id: true,
	roomId: true,
	userId: true,
	joinedAt: true,
	lastReadMessageId: true,
	lastReadAt: true,
  unreadCount: true,
	isHidden: true,
} satisfies Prisma.ChatParticipantSelect;

type ChatParticipantListItem = Prisma.ChatParticipantGetPayload<{
	select: typeof chatParticipantSelect;
}>;

const chatRoomListSelect = {
  roomId: true,
  lastReadMessageId: true,
  lastReadAt: true,
  unreadCount: true,
  isHidden: true,
  room: {
    select: {
      id: true,
      directKey: true,
      lastMessageId: true,
      lastMessageAt: true,
      lastMessagePreview: true,
      createdAt: true,
      updatedAt: true,
      participants: {
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              username: true,
              profileImageUrl: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ChatParticipantSelect;

type ChatRoomParticipantListItem = Prisma.ChatParticipantGetPayload<{
  select: typeof chatRoomListSelect;
}>;

@Injectable()
export class ChatParticipantRepository {
	constructor(private readonly prisma: PrismaService) {}

	createParticipant(data: Prisma.ChatParticipantCreateInput, db: DbClient = this.prisma): Promise<ChatParticipantListItem> {
		return db.chatParticipant.create({
			data,
			select: chatParticipantSelect,
		});
	}

	findParticipantsByRoomId(roomId: number, db: DbClient = this.prisma): Promise<ChatParticipantListItem[]> {
		return db.chatParticipant.findMany({
			where: {
				roomId,
			},
			select: chatParticipantSelect,
		});
	}

	findParticipantByRoomAndUser(roomId: number, userId: number, db: DbClient = this.prisma): Promise<ChatParticipantListItem | null> {
		return db.chatParticipant.findUnique({
			where: {
				roomId_userId: {
					roomId,
					userId,
				},
			},
			select: chatParticipantSelect,
		});
	}

  findVisibleRoomsByUserId(userId: number, db: DbClient = this.prisma): Promise<ChatRoomParticipantListItem[]> {
    return db.chatParticipant.findMany({
      where: {
        userId,
        isHidden: false,
      },
      select: chatRoomListSelect,
    });
  }

  async updateParticipantByRoomAndUser(
    roomId: number,
    userId: number,
    data: Prisma.ChatParticipantUpdateInput,
    db: DbClient = this.prisma,
  ) {
    return db.chatParticipant.update({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
      data,
    });
  }

  async updateUnreadCountByRoomAndUser(
    roomId: number,
    userId: number,
    incrementBy: number,
    db: DbClient = this.prisma,
  ) {
    return db.chatParticipant.update({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
      data: {
        unreadCount: {
          increment: incrementBy,
        },
        isHidden: false,
      },
    });
  }
}

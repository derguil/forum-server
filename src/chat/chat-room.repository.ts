import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';
import { DbClient } from '../infra/prisma/prisma.DbClientType';

const chatRoomSelect = {
  id: true,
  directKey: true,
  lastMessageId: true,
  lastMessageAt: true,
  lastMessagePreview: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ChatRoomSelect;

type ChatRoomListItem = Prisma.ChatRoomGetPayload<{
  select: typeof chatRoomSelect;
}>;

@Injectable()
export class ChatRoomRepository {
  constructor(private readonly prisma: PrismaService) {}

  getChatRoomByDirectKey(directKey: string, db: DbClient = this.prisma): Promise<ChatRoomListItem | null> {
    return db.chatRoom.findUnique({
      where: { directKey },
      select: chatRoomSelect
    })
  }

  createChatRoom(data: Prisma.ChatRoomCreateInput, db: DbClient = this.prisma): Promise<ChatRoomListItem> {
    return db.chatRoom.create({
      data,
      select: chatRoomSelect
    })
  }

  getRoomById(roomId: number, db: DbClient = this.prisma): Promise<ChatRoomListItem | null> {
    return db.chatRoom.findUnique({
      where: { id: roomId },
      select: chatRoomSelect,
    })
  }

  updateRoomLastMessage(
    roomId: number,
    lastMessageId: number,
    lastMessageAt: Date,
    lastMessagePreview: string,
    db: DbClient = this.prisma,
  ) {
    return db.chatRoom.update({
      where: { id: roomId },
      data: {
        lastMessageId,
        lastMessageAt,
        lastMessagePreview,
      },
    });
  }

}

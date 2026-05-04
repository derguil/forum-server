import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';
import { DbClient } from '../infra/prisma/prisma.DbClientType';

const messageSelect = {
  id: true,
  roomId: true,
  senderId: true,
  type: true,
  content: true,
  createdAt: true,
} satisfies Prisma.MessageSelect;

type MessageListItem = Prisma.MessageGetPayload<{
  select: typeof messageSelect;
}>;

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  createMessage(data: Prisma.MessageCreateInput, db: DbClient = this.prisma): Promise<MessageListItem> {
    return db.message.create({
      data,
      select: messageSelect,
    });
  }

  findMessagesByRoomId(roomId: number, db: DbClient = this.prisma): Promise<MessageListItem[]> {
    return db.message.findMany({
      where: {
        roomId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: messageSelect,
    });
  }

  findMessageById(messageId: number, db: DbClient = this.prisma): Promise<MessageListItem | null> {
    return db.message.findUnique({
      where: { id: messageId },
      select: messageSelect,
    });
  }

  findMessageByIdIncludingDeleted(messageId: number, db: DbClient = this.prisma): Promise<MessageListItem | null> {
    return db.message.findUnique({
      where: { id: messageId },
      select: messageSelect,
    });
  }

  softDeleteMessageById(messageId: number, db: DbClient = this.prisma): Promise<MessageListItem> {
    return db.message.update({
      where: {
        id: messageId,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
      select: messageSelect,
    });
  }

  softDeleteMessagesByChatRoomId(chatRoomId: number, db: DbClient = this.prisma): Promise<{ count: number }> {
    return db.message.updateMany({
      where: {
        roomId: chatRoomId,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
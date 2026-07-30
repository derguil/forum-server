import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ChatRoomRepository } from './chat-room.repository';
import { MessageRepository } from './message.repository';
import { ChatParticipantRepository } from './chatparticipant.repository';
import { PrismaService } from '../infra/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRoomRepository: ChatRoomRepository,
    private readonly messageRepository: MessageRepository,
    private readonly chatParticipantRepository: ChatParticipantRepository,
    private readonly prisma: PrismaService
  ) {}

  private buildDirectKey(postId: number, userId1: number, userId2: number) {
    return `post:${postId}:${[userId1, userId2].sort().join('-')}`;
  }

  private validateCreateRoomUsers(userId1: number, userId2: number) {
    if (userId1 === userId2) {
      throw new BadRequestException('You cannot create a chat room with yourself.');
    }
  }

  private parsePostIdFromDirectKey(directKey: string): number | null {
    const [prefix, postId] = directKey.split(':');
    if (prefix !== 'post') {
      return null;
    }

    const parsedPostId = Number(postId);
    return Number.isInteger(parsedPostId) ? parsedPostId : null;
  }

  async getDirectRoom(postId: number, userId1: number, userId2: number) {
    this.validateCreateRoomUsers(userId1, userId2);
    return this.chatRoomRepository.getChatRoomByDirectKey(this.buildDirectKey(postId, userId1, userId2));
  }

  async createRoom(postId: number, userId1: number, userId2: number) {
    this.validateCreateRoomUsers(userId1, userId2);
    const directKey = this.buildDirectKey(postId, userId1, userId2);

    return this.prisma.$transaction(async (tx) => {
      const createdRoom = await this.chatRoomRepository.createChatRoom(
        {
          directKey,
        },
        tx,
      );

      await this.chatParticipantRepository.createParticipant(
        {
          room: { connect: { id: createdRoom.id } },
          user: { connect: { id: userId1 } },
        },
        tx,
      );

      await this.chatParticipantRepository.createParticipant(
        {
          room: { connect: { id: createdRoom.id } },
          user: { connect: { id: userId2 } },
        },
        tx,
      );

      return createdRoom;
    });
  }

  async createOrGetRoom(postId: number, userId1: number, userId2: number) {
    const existingRoom = await this.getDirectRoom(postId, userId1, userId2);
    if (existingRoom) {
      return existingRoom;
    }

    return this.createRoom(postId, userId1, userId2);
  }

  async getRoomByIdForUser(roomId: number, userId: number) {
    const participant = await this.chatParticipantRepository.findParticipantByRoomAndUser(roomId, userId);
    if (!participant) {
      throw new ForbiddenException('You are not participating in this chat.');
    }

    const room = await this.chatRoomRepository.getRoomById(roomId);
    if (!room) {
      throw new ForbiddenException('Chat room does not exist.');
    }

    return room;
  }

  async getRooms(userId: number) {
    const rooms = await this.chatParticipantRepository.findVisibleRoomsByUserId(userId);

    return rooms
      .map((participant) => {
        const otherParticipant = participant.room.participants.find((roomParticipant) => roomParticipant.userId !== userId);

        return {
          roomId: participant.room.id,
          postId: this.parsePostIdFromDirectKey(participant.room.directKey),
          unreadCount: participant.unreadCount,
          lastReadMessageId: participant.lastReadMessageId,
          lastReadAt: participant.lastReadAt,
          lastMessageId: participant.room.lastMessageId,
          lastMessageAt: participant.room.lastMessageAt,
          lastMessagePreview: participant.room.lastMessagePreview,
          createdAt: participant.room.createdAt,
          updatedAt: participant.room.updatedAt,
          otherUser: otherParticipant
            ? {
                id: otherParticipant.user.id,
                username: otherParticipant.user.username,
                profileImageUrl: otherParticipant.user.profileImageUrl,
              }
            : null,
        };
      })
      .sort((left, right) => {
        const leftTime = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : new Date(left.updatedAt).getTime();
        const rightTime = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : new Date(right.updatedAt).getTime();
        return rightTime - leftTime;
      });
  }

  async getOtherParticipantIds(roomId: number, userId: number): Promise<number[]> {
    const participants = await this.chatParticipantRepository.findParticipantsByRoomId(roomId);

    return participants
      .filter((participant) => participant.userId !== userId)
      .map((participant) => participant.userId);
  }

  async getMessagesByRoomId(roomId: number, userId: number) {
    await this.getRoomByIdForUser(roomId, userId);
    return this.messageRepository.findMessagesByRoomId(roomId);
  }

  async sendMessage(roomId: number, senderId: number, content: string) {
    if (!content) {
      throw new BadRequestException('Message content is empty.');
    }

    const participant = await this.chatParticipantRepository.findParticipantByRoomAndUser(roomId, senderId);
    if (!participant) {
      throw new ForbiddenException('You are not participating in this chat.');
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const createdMessage = await this.messageRepository.createMessage(
        {
          room: {
            connect: {
              id: roomId,
            },
          },
          sender: {
            connect: {
              id: senderId,
            },
          },
          content,
          type: 'TEXT',
        },
        tx,
      );

      await this.chatRoomRepository.updateRoomLastMessage(
        roomId,
        createdMessage.id,
        createdMessage.createdAt,
        content.slice(0, 50),
        tx,
      );

      return createdMessage;
    });

    return message;
  }

  async markAsRead(roomId: number, userId: number, messageId: number) {
    return this.chatParticipantRepository.updateParticipantByRoomAndUser(
      roomId,
      userId,
      {
        lastReadMessageId: messageId,
        lastReadAt: new Date(),
        unreadCount: 0,
        isHidden: false,
      },
    );
  }

  async incrementUnreadCount(roomId: number, userId: number) {
    return this.chatParticipantRepository.updateUnreadCountByRoomAndUser(
      roomId,
      userId,
      1,
    );
  }
}
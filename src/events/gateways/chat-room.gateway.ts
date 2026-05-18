import { SubscribeMessage, WebSocketGateway, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { BaseSocketGateway } from './base-socket.gateway';
import { ChatService } from '../../chat/chat.service';
import { WsJwtAccessGuard } from '../../common/guards/ws-jwt-access.guard';
import { UseGuards } from '@nestjs/common';
import { GetWsUser } from '../../common/decoraters/get-ws-user.decorater';
import type { JwtAccessPayload } from '../../auth/jwt.strategy';
import { JoinChatRoomDto } from './dto/join-chat-room.dto';
import { ReadMessagesDto } from './dto/read-messages.dto';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({ namespace: 'chat' })
export class ChatRoomGateway extends BaseSocketGateway {
  constructor(private readonly chatService: ChatService) {
    super();
  }

  private async emitRoomsUpdated(userIds: number[]) {
    const roomListUserIds = [...new Set(userIds)];

    for (const roomListUserId of roomListUserIds) {
      const rooms = await this.chatService.getRooms(roomListUserId);
      this.server.to(`user-room:${roomListUserId}`).emit('roomsUpdated', rooms);
    }
  }

  @SubscribeMessage('joinChatRoom')
  @UseGuards(WsJwtAccessGuard)
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @GetWsUser() jwtAccessPayload: JwtAccessPayload,
    @MessageBody() payload: JoinChatRoomDto,
  ) {
    const userId = jwtAccessPayload.sub;
    if (!userId) {
      return { success: false, message: 'Unauthorized socket user' };
    }

    const chatRoom = await this.chatService.getRoomByIdForUser(payload.roomId, userId);

    const room = `chat-room:${chatRoom.id}`;

    this.bindUser(client, userId);
    this.setCurrentRoom(client, chatRoom.id);

    client.join(room);
    return { success: true, roomId: chatRoom.id, room };
  }

  @SubscribeMessage('leaveChatRoom')
  @UseGuards(WsJwtAccessGuard)
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @GetWsUser() jwtAccessPayload: JwtAccessPayload,
    @MessageBody() payload: { roomId: number },
  ) {
    const userId = jwtAccessPayload.sub;
    if (!userId) {
      return { success: false, message: 'Unauthorized socket user' };
    }

    if (!payload?.roomId || !Number.isInteger(payload.roomId) || payload.roomId <= 0) {
      return { success: false, message: 'Invalid roomId' };
    }

    const room = `chat-room:${payload.roomId}`;
    client.leave(room);
    this.clearCurrentRoom(client, payload.roomId);
    return { success: true, room };
  } 

  @SubscribeMessage('sendMessage')
  @UseGuards(WsJwtAccessGuard)
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @GetWsUser() jwtAccessPayload: JwtAccessPayload,
    @MessageBody() payload: SendMessageDto,
  ) {
    try {
      const senderId = jwtAccessPayload.sub;
      if (!senderId) {
        return { success: false, message: 'Unauthorized socket user' };
      }

      const message = await this.chatService.sendMessage(
        payload.roomId,
        senderId,
        payload.content,
      );

      const otherParticipantIds = await this.chatService.getOtherParticipantIds(
        payload.roomId,
        senderId,
      );

      for (const otherUserId of otherParticipantIds) {
        if (this.isUserViewingRoom(otherUserId, payload.roomId)) {
          await this.chatService.markAsRead(
            payload.roomId,
            otherUserId,
            message.id,
          );
        } else {
          await this.chatService.incrementUnreadCount(
            payload.roomId,
            otherUserId,
          );
        }
      }

      await this.chatService.markAsRead(payload.roomId, senderId, message.id);

      await this.emitRoomsUpdated([senderId, ...otherParticipantIds]);

      this.server.to(`chat-room:${payload.roomId}`).emit('newMessage', {
        id: message.id,
        roomId: message.roomId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @SubscribeMessage('readMessages')
  @UseGuards(WsJwtAccessGuard)
  async handleReadMessages(
    @GetWsUser() jwtAccessPayload: JwtAccessPayload,
    @MessageBody() payload: ReadMessagesDto,
  ) {
    try {
      const userId = jwtAccessPayload.sub;
      if (!userId) {
        return { success: false, message: 'Unauthorized socket user' };
      }

      await this.chatService.getRoomByIdForUser(payload.roomId, userId);
      await this.chatService.markAsRead(payload.roomId, userId, payload.messageId);

      const otherParticipantIds = await this.chatService.getOtherParticipantIds(payload.roomId, userId);
      await this.emitRoomsUpdated([userId, ...otherParticipantIds]);

      return { success: true };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
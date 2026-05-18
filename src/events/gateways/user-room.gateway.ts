import { ConnectedSocket, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { BaseSocketGateway } from './base-socket.gateway';
import { GetWsUser } from '../../common/decoraters/get-ws-user.decorater';
import { UseGuards } from '@nestjs/common';
import { WsJwtAccessGuard } from '../../common/guards/ws-jwt-access.guard';
import type { JwtAccessPayload } from '../../auth/jwt.strategy';

@WebSocketGateway({ namespace: 'chat' })
export class UserRoomGateway extends BaseSocketGateway {
  handleDisconnect(client: Socket): void {
    super.handleDisconnect(client);
  }

  @SubscribeMessage('joinUserRoom')
  @UseGuards(WsJwtAccessGuard)
  handleJoinUserRoom(
    @ConnectedSocket() client: Socket,
    @GetWsUser() jwtAccessPayload: JwtAccessPayload
  ) {
    const userId: number = jwtAccessPayload.sub

    const room = `user-room:${userId}`;
    client.join(room);

    return { success: true, room };
  }
}
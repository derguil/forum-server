import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export abstract class BaseSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private readonly socketIdToUserId = new Map<string, number>();
  private readonly socketIdToRoomId = new Map<string, number>();
  // socket(연결)별로 저장
  // 이 map은 메모리(in-memory)라서 서버 프로세스 기준으로만 유지
  // Gateway 인스턴스마다 map이 따로 있으므로 
  // UserRoomGateway와 ChatRoomGateway는 서로 다른 map을 가짐

  protected bindUser(client: Socket, userId: number) { //이 소켓이 누구 건지 저장
    this.socketIdToUserId.set(client.id, userId);
  }

  protected setCurrentRoom(client: Socket, roomId: number) { //이 소켓이 지금 어느 채팅방 보고 있는지 저장
    this.socketIdToRoomId.set(client.id, roomId);
  }

  protected clearCurrentRoom(client: Socket, roomId?: number) { //방 나가면 지움
    const currentRoomId = this.socketIdToRoomId.get(client.id);

    if (roomId === undefined || currentRoomId === roomId) {
      this.socketIdToRoomId.delete(client.id);
    }
  }

  protected isUserViewingRoom(userId: number, roomId: number): boolean { //그 유저가 지금 그 방을 보고 있는지 확인
    for (const [socketId, mappedUserId] of this.socketIdToUserId.entries()) {
      if (mappedUserId !== userId) continue;
      if (this.socketIdToRoomId.get(socketId) === roomId) {
        return true;
      }
    }
    return false;
  }

  handleConnection(_client: Socket): void {}

  handleDisconnect(client: Socket): void {
    this.socketIdToUserId.delete(client.id);
    this.socketIdToRoomId.delete(client.id);
  }
}
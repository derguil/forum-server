import { Module } from '@nestjs/common';
import { ChatRoomGateway } from './gateways/chat-room.gateway';
import { UserRoomGateway } from './gateways/user-room.gateway';
import { ChatModule } from '../chat/chat.module';
import { WsJwtAccessGuard } from '../common/guards/ws-jwt-access.guard';

@Module({
  imports: [ChatModule],
  providers: [WsJwtAccessGuard, UserRoomGateway, ChatRoomGateway]
})
export class EventsModule {}

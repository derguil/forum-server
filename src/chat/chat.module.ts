import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatRoomRepository } from './chat-room.repository';
import { MessageRepository } from './message.repository';
import { ChatParticipantRepository } from './chatparticipant.repository';
import { PrismaService } from '../infra/prisma/prisma.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatRoomRepository, MessageRepository, ChatParticipantRepository, PrismaService],
  exports: [ChatService],
})
export class ChatModule {}

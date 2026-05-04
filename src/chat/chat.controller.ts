import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../common/decoraters/get-user.decorator';
import type { JwtAccessPayload } from '../auth/jwt.strategy';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  @UseGuards(AuthGuard('jwt-access'))
  async createRoom(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @Body() createRoomDto: CreateRoomDto,
  ) {
    const existingRoom = await this.chatService.getDirectRoom(
      createRoomDto.postId,
      jwtAccessPayload.sub,
      createRoomDto.targetUserId,
    );

    if (existingRoom) {
      return existingRoom;
    }

    return this.chatService.createRoom(
      createRoomDto.postId,
      jwtAccessPayload.sub,
      createRoomDto.targetUserId,
    );
  }

  @Get('rooms')
  @UseGuards(AuthGuard('jwt-access'))
  getRooms(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
  ) {
    return this.chatService.getRooms(jwtAccessPayload.sub);
  }

  @Get('rooms/:roomId/messages')
  @UseGuards(AuthGuard('jwt-access'))
  getMessagesByRoomId(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @Param('roomId', ParseIntPipe) roomId: number,
  ) {
    return this.chatService.getMessagesByRoomId(roomId, jwtAccessPayload.sub);
  }
}

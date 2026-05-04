import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ForumsService } from './forums.service';
import { CreateForumDto } from './dto/create-forum.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../common/decoraters/get-user.decorator';
import type { JwtAccessPayload } from '../auth/jwt.strategy';

@Controller('forums')
export class ForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt-access')) 
  addForum(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @Body() createForumDto: CreateForumDto
  ) {
    return this.forumsService.addForum(createForumDto, jwtAccessPayload.sub);
  }

  @Get()
  getForums() {
    return this.forumsService.getForums();
  }

  @Get('/:forumId')
  getForumById(@Param('forumId', ParseIntPipe) forumId: number) {
    return this.forumsService.getForumById(forumId);
  }
}


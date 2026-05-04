import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentsDto } from './dto/get-comments.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../common/decoraters/get-user.decorator';
import type { JwtAccessPayload } from '../auth/jwt.strategy';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt-access'))
  addComment(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @Body() createCommentDto: CreateCommentDto
  ) {
    return this.commentsService.addComment(jwtAccessPayload.sub, createCommentDto);
  }

  // @Get()
  // getComments(@Query() getCommentsDto: GetCommentsDto) {
  //   return this.commentsService.getComments(getCommentsDto);
  // }

  @Delete('/:commentId')
  @UseGuards(AuthGuard('jwt-access'))
  softDeleteComment(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @Param('commentId', ParseIntPipe) commentId: number
  ) {
    return this.commentsService.softDeleteCommentByCommentId(jwtAccessPayload.sub, commentId);
  }
}

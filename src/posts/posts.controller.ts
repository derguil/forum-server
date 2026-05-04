import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseInterceptors, UploadedFiles, ParseFilePipe, FileTypeValidator, MaxFileSizeValidator, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { GetPostsDto } from './dto/get-posts.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../common/decoraters/get-user.decorator';
import type { JwtAccessPayload } from '../auth/jwt.strategy';
import { FilesInterceptor } from '@nestjs/platform-express';
import { createPostImageFilesPipe } from '../common/pipes/post-image-files.pipe';
import { OptionalJwtAccessGuard } from '../common/guards/optional-jwt-access.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt-access'))  
  @UseInterceptors(FilesInterceptor('files', 20))
  addPost(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @UploadedFiles(createPostImageFilesPipe(false)) files: Express.Multer.File[],
    @Body() createPostDto: CreatePostDto) {
    return this.postsService.addPost(jwtAccessPayload.sub, createPostDto, files);
  }

  @Get()
  getPosts(@Query() getPostsDto: GetPostsDto) {
    return this.postsService.getPosts(getPostsDto);
  }

  @Get('/:postId')
  @UseGuards(OptionalJwtAccessGuard)
  getPostById(
    @Param('postId', ParseIntPipe) postId: number,
    @GetUser() jwtAccessPayload?: JwtAccessPayload,
  ) {
    return this.postsService.getPostById(postId, jwtAccessPayload?.sub);
  }

  @Patch('/:postId')
  @UseGuards(AuthGuard('jwt-access'))
  @UseInterceptors(FilesInterceptor('files', 20))
  updatePost(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @Param('postId', ParseIntPipe) postId: number,
    @UploadedFiles(createPostImageFilesPipe(false)) files: Express.Multer.File[],
    @Body() updatePostDto: UpdatePostDto
  ) {
    return this.postsService.updatePost(jwtAccessPayload.sub, postId, updatePostDto, files);
  }

  @Delete('/:postId')
  @UseGuards(AuthGuard('jwt-access'))
  softDeletePost(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @Param('postId', ParseIntPipe) postId: number
  ) {
    return this.postsService.softDeletePost(jwtAccessPayload.sub, postId);
  }

  // @Delete('/admin/posts/:postId')
  // @UseGuards(AuthGuard('jwt-access'))
  // hardDeletePost(
  //   @GetUser() jwtAccessPayload: JwtAccessPayload,
  //   @Param('postId', ParseIntPipe) postId: number
  // ) {
  //   return this.postsService.hardDeletePost(jwtAccessPayload.sub, postId);
  // }

  @Post('/:postId/postvote')
  @UseGuards(AuthGuard('jwt-access'))
  addPostVote(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @Param('postId', ParseIntPipe) postId: number
  ) {
    return this.postsService.addPostVote(jwtAccessPayload.sub, postId);
  }

  @Delete('/:postId/postvote')
  @UseGuards(AuthGuard('jwt-access'))
  removePostVote(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @Param('postId', ParseIntPipe) postId: number
  ) {
    return this.postsService.removePostVote(jwtAccessPayload.sub, postId);
  }

  @Post('/:postId/scrap')
  @UseGuards(AuthGuard('jwt-access'))
  addScrap(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @Param('postId', ParseIntPipe) postId: number
  ) {
    return this.postsService.addScrap(jwtAccessPayload.sub, postId);
  }

  @Delete('/:postId/scrap')
  @UseGuards(AuthGuard('jwt-access'))
  removeScrap(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @Param('postId', ParseIntPipe) postId: number
  ) {
    return this.postsService.removeScrap(jwtAccessPayload.sub, postId);
  }
}

import { Controller, Get, Body, Patch, UseGuards, Query, Put, UseInterceptors, UploadedFile } from '@nestjs/common';
import { MeService } from './me.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../common/decoraters/get-user.decorator';
import type { JwtAccessPayload } from '../auth/jwt.strategy';
import { GetMyPostsDto } from './dto/get-my-posts.dto';
import { ChangeUsernameDto } from './dto/change-username.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { createPostImageFilesPipe } from '../common/pipes/post-image-files.pipe';

@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  @UseGuards(AuthGuard('jwt-access'))
  getMyPage(@GetUser() jwtAccessPayload: JwtAccessPayload) {
    return this.meService.getMyPage(jwtAccessPayload.sub);
  }

  @Patch('/username')
  @UseGuards(AuthGuard('jwt-access'))
  changeUsername(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @Body() changeUsernameDto: ChangeUsernameDto,
  ) {
    return this.meService.changeUsername(jwtAccessPayload.sub, changeUsernameDto);
  }

  @Patch('/email')
  @UseGuards(AuthGuard('jwt-access'))
  changeEmail(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @Body() changeEmailDto: ChangeEmailDto,
  ) {
    return this.meService.changeEmail(jwtAccessPayload.sub, changeEmailDto);
  }

  @Put('/profile-image')
  @UseGuards(AuthGuard('jwt-access'))
  @UseInterceptors(FileInterceptor('profileImg'))
  changeProfileImage(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @UploadedFile(createPostImageFilesPipe(true)) profileImg: Express.Multer.File,
  ) {
    return this.meService.changeProfileImage(jwtAccessPayload.sub, profileImg);
  }

  @Patch('/password')
  @UseGuards(AuthGuard('jwt-access'))
  changePassword(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.meService.changePassword(jwtAccessPayload.sub, changePasswordDto);
  }

  @Get('/posts')
  @UseGuards(AuthGuard('jwt-access'))  
  getMyPosts(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @Query() getMyPostsDto: GetMyPostsDto
  ) {
    return this.meService.getMyPosts(jwtAccessPayload.sub, getMyPostsDto);
  }

  @Get('/comments')
  @UseGuards(AuthGuard('jwt-access'))  
  getMycomments(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @Query() getMyPostsDto: GetMyPostsDto
  ) {
    return this.meService.getMycomments(jwtAccessPayload.sub, getMyPostsDto);
  }

  @Get('/scraps')
  @UseGuards(AuthGuard('jwt-access'))  
  getMyScraps(
    @GetUser() jwtAccessPayload: JwtAccessPayload,
    @Query() getMyPostsDto: GetMyPostsDto
  ) {
    return this.meService.getMyScraps(jwtAccessPayload.sub, getMyPostsDto);
  }
}
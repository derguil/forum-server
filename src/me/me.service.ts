import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { MeRepository } from './me.repository';
import { GetMyPostsDto } from './dto/get-my-posts.dto';
import { Post } from '@prisma/client';
import { ChangeUsernameDto } from './dto/change-username.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { S3clientService } from '../infra/s3client/s3client.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MeService {
  constructor(
    private readonly meRepository: MeRepository,
    private readonly s3ClientService: S3clientService,
  ) {}

  async getMyPage(userId: number): Promise<{ username: string; email: string; profileImg: string | null }> {
    const user = await this.meRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('유저 정보를 찾을 수 없습니다');
    }

    return {
      username: user.username,
      email: user.email,
      profileImg: user.profileImageUrl,
    };
  }

  async changeUsername(userId: number, changeUsernameDto: ChangeUsernameDto): Promise<{ message: string }> {
    const { username } = changeUsernameDto;
    if (!username) {
      throw new BadRequestException('아이디가 필요합니다');
    }

    const existing = await this.meRepository.findUserByUsername(username);
    if (existing && existing.id !== userId) {
      throw new ConflictException('이미 사용 중인 아이디');
    }

    await this.meRepository.updateUsername(userId, username);
    return { message: '아이디 변경 완료' };
  }

  async changeEmail(userId: number, changeEmailDto: ChangeEmailDto): Promise<{ message: string }> {
    const { email } = changeEmailDto;
    if (!email) {
      throw new BadRequestException('email이 필요합니다');
    }

    const existing = await this.meRepository.findUserByEmail(email);
    if (existing && existing.id !== userId) {
      throw new ConflictException('이미 사용 중인 이메일');
    }

    await this.meRepository.updateEmail(userId, email);
    return { message: 'email 변경 완료' };
  }

  async changeProfileImage(userId: number, profileImg: Express.Multer.File): Promise<{ message: string; profileImg: string }> {
    if (!profileImg) {
      throw new BadRequestException('프로필 이미지가 필요합니다');
    }

    const user = await this.meRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('유저 정보를 찾을 수 없습니다');
    }

    const uploaded = await this.s3ClientService.uploadProfileImage(profileImg, userId);
    const uploadedImage = uploaded.files[0];

    if (user.profileImageKey) {
      await this.s3ClientService.deleteProfileFiles([user.profileImageKey]);
    }

    await this.meRepository.updateProfileImage(userId, uploadedImage.key, uploadedImage.url);

    return {
      message: '프로필 사진 변경 완료',
      profileImg: uploadedImage.url,
    };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    if (!currentPassword || !newPassword) {
      throw new BadRequestException('비밀번호 정보가 필요합니다');
    }

    const user = await this.meRepository.findUserWithPasswordById(userId);
    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('현재 비밀번호가 틀렸습니다');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.meRepository.updatePasswordAndLogout(userId, newPasswordHash);

    return { message: '비밀번호 변경 완료. 다시 로그인하세요.' };
  }

  async getMyPosts(userId: number, getMyPostsDto: GetMyPostsDto): Promise<Post[]> {
    const { page, limit } = getMyPostsDto
    return await this.meRepository.findPostsByUserId(userId, page, limit)
  }

  async getMycomments(userId: number, getMyPostsDto: GetMyPostsDto): Promise<Post[]> {
    const { page, limit } = getMyPostsDto
    return await this.meRepository.findPostsByComments(userId, page, limit)
  }

  async getMyScraps(userId: number, getMyPostsDto: GetMyPostsDto): Promise<Post[]> {
    const { page, limit } = getMyPostsDto
    return await this.meRepository.findPostsByScrap(userId, page, limit)
  }
}

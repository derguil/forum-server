import { Injectable, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRepository } from './user.repository';
import { SafeUser } from './dto/safeuser.dto';
import { AuthGenerateTokenService } from './auth.generate-token.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authGenerateTokenService: AuthGenerateTokenService
  ) {}

  async getMe(userId: number): Promise<SafeUser | null> {
    const user = await this.userRepository.findByUserId(userId)

    if (!user) return null

    const { passwordHash, hashedRefreshToken, ...safeUser } = user;
    return safeUser
  }

  async register(registerDto: RegisterDto): Promise<void>{
    const { username, email, password, password2 } = registerDto

    if (password !== password2) {
      throw new BadRequestException('Password confirmation does not match.');
    }
    
    // const salt = await bcrypt.genSalt()
    const passwordHash = await bcrypt.hash(password, 10); //숫자(10): saltRounds (권장)

    try {
      await this.userRepository.createUser({
        username,
        email,
        passwordHash
      });
    } catch (e) {
      if (e.code === 'P2002') {
        const target = e.meta?.target;
        // console.log(target)
        if (target.includes('username')) {
          throw new ConflictException('Username already exists.');
        }
        if (target.includes('email')) {
          throw new ConflictException('Email already exists.');
        }

        throw new ConflictException('A duplicate value exists.');
      }
      throw e;
    }
  }

  async login(loginDto: LoginDto): Promise<{accessToken: string, refreshToken: string}> {
    const { username, password } = loginDto

    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new ConflictException('Username does not exist.');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new ConflictException('Password does not match.');
    }

    const accessToken = await this.authGenerateTokenService.generateAccessToken(user.id, user.username)
    const refreshToken = await this.authGenerateTokenService.generateRefreshToken(user.id);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.updateRefreshTokenHash(user.id, hashedRefreshToken);

    return { accessToken, refreshToken }
  }

  async refreshTokens(userId: number, refreshToken: string): Promise<{accessToken: string, refreshToken: string}> {
    const user = await this.userRepository.findByIdWithRefreshToken(userId);

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Login is required.');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.hashedRefreshToken);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const newAccessToken = await this.authGenerateTokenService.generateAccessToken(user.id, user.username);
    const newRefreshToken = await this.authGenerateTokenService.generateRefreshToken(user.id);
    const newHashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
    await this.userRepository.updateRefreshTokenHash(user.id, newHashedRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: number, refreshToken: string): Promise<void> {
    const user = await this.userRepository.findByIdWithRefreshToken(userId);

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException();
    }

    const isMatch = await bcrypt.compare(refreshToken, user.hashedRefreshToken);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    await this.userRepository.updateRefreshTokenHash(user.id, null);
  }
}
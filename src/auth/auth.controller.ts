import { Controller, Get, Post, Body, UseGuards, Res, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../common/decoraters/get-user.decorator';
import type { JwtAccessPayload, JwtRefreshPayload } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}
  
  @Get('me')
  @UseGuards(AuthGuard('jwt-access'))   
  getMe(@GetUser() jwtAccessPayload: JwtAccessPayload) {
    return this.authService.getMe(jwtAccessPayload.sub);
  }

  @Post('register')
  async register(@Body() registerdto: RegisterDto) {
    await this.authService.register(registerdto);
    return {
      success: true,
      message: '회원가입 성공'
    };
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(loginDto);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false, // https에서만 (개발중이면 false 가능)
      sameSite: 'strict',
      path: '/api/auth/refresh',
      maxAge: 3 * 60 * 1000 * 60, //3hour
    });

    return {
      success: true,
      message: '로그인 성공',
      accessToken,
    };
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  async refresh(
    @GetUser() jwtRefreshPayload: JwtRefreshPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshTokens(jwtRefreshPayload.sub, refreshToken);
    
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 3 * 60 * 1000 * 60, //3hour
    });

    return {
      success: true,
      message: 'access-token 재발급 성공',
      accessToken,
    };
  }
  
  @Post('logout')
  @UseGuards(AuthGuard('jwt-refresh'))
  async logout(
    @GetUser() jwtRefreshPayload: JwtRefreshPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    await this.authService.logout(jwtRefreshPayload.sub, refreshToken);
  
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });
    
    return {
      success: true,
      message: '로그아웃 성공'
    };
  }
}

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserRepository } from "./user.repository";
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

export type JwtAccessPayload = {
  sub: number,
  username: string,
  iat?: number;
  exp?: number;
}

export type JwtRefreshPayload = {
  sub: number,
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => {
          const authToken = req?.auth?.token;
          if (typeof authToken !== 'string') {
            return null;
          }

          return authToken.startsWith('Bearer ')
            ? authToken.slice(7)
            : authToken;
        },
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtAccessPayload) {
    return payload;
  }
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.refresh_token,
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
    })
  }
  validate(payload: JwtRefreshPayload) {
    return payload
  }
} 
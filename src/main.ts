import { NestFactory } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env' : '.env.test',
  override: true,
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // NestJS 내부 로그(시작, 라우트 등록 등)도 Winston으로 출력
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  });
  const configService = app.get(ConfigService);
  app.setGlobalPrefix('api');
  app.use(cookieParser())
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,//DTO에 정의되지 않은 필드는 자동으로 제거됨
      forbidNonWhitelisted: true,//DTO에 없는 필드가 들어오면 아예 에러 발생
      transform: true,//타입 자동 변환 //DTO에 타입이 정의되어 있을 때만 자동 변환됨
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
  await app.listen(configService.get<number>('PORT', 3000));
}
bootstrap(); 

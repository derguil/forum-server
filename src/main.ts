import { NestFactory } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { RedisIoAdapter } from './events/adapters/redis-io.adapter';

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env' : '.env.test',
  override: true,
});

async function bootstrap() {
  const logger = new Logger('Bootstrap');
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
  const redisUrl = configService.get<string>('REDIS_URL');

  const redisIoAdapter = new RedisIoAdapter(app);
  if (redisUrl) {
    try {
      await redisIoAdapter.connectToRedis(redisUrl);
    } catch (error) {
      logger.warn(
        `Redis adapter disabled. Failed to connect to REDIS_URL=${redisUrl}. Falling back to in-memory adapter.`,
      );
      logger.warn(error instanceof Error ? error.message : 'Unknown redis error');
    }
  } else {
    logger.log('REDIS_URL is not set. Running Socket.IO with in-memory adapter.');
  }

  app.useWebSocketAdapter(redisIoAdapter);

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

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

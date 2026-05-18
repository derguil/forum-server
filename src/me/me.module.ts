import { Module } from '@nestjs/common';
import { MeService } from './me.service';
import { MeController } from './me.controller';
import { MeRepository } from './me.repository';
import { PrismaModule } from '../infra/prisma/prisma.module';
import { S3clientModule } from '../infra/s3client/s3client.module';

@Module({
  imports: [PrismaModule, S3clientModule],
  controllers: [MeController],
  providers: [MeService, MeRepository],
})
export class MeModule {}

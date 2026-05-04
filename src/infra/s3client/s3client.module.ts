import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { S3clientService } from './s3client.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'S3_CLIENT',
      useFactory: (configService: ConfigService) => {
        const region = configService.get<string>('AWS_REGION', 'ap-northeast-2');
        const accessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY');

        if (!accessKeyId || !secretAccessKey) {
          throw new Error('AWS credentials are not set in environment variables');
        }
        return new S3Client({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
      },
      inject: [ConfigService],
    },
    S3clientService,
  ],
  exports: [S3clientService],
})
export class S3clientModule {}

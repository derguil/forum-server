import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3clientService {
  private readonly postBucket: string;

  constructor(
    @Inject('S3_CLIENT') private readonly s3: S3Client,
    private readonly configService: ConfigService,
  ) {
    const postBucket = this.configService.get<string>('AWS_S3_BUCKET');

    if (!postBucket) {
      throw new Error('AWS_S3_BUCKET is not set in environment variables');
    }

    this.postBucket = postBucket;
  }

  private getPublicUrl(bucket: string, key: string): string {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  private async uploadToBucket(files: Express.Multer.File[], userId: number, bucket: string, prefix: string) {
    const now = Date.now();
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const ext = file.originalname.split('.').pop();
        const key = `${prefix}/${userId}/${now}-${Math.random().toString(36).substring(7)}.${ext}`;
        await this.s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          }),
        );
        return {
          originalname: file.originalname,
          key,
          url: this.getPublicUrl(bucket, key),
          size: file.size,
          type: file.mimetype,
        };
      }),
    );

    return {
      success: true,
      files: uploadedFiles,
    };
  }

  private async deleteFromBucket(keys: string[], bucket: string) {
    await Promise.all(
      keys.map((key) =>
        this.s3.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
          }),
        ),
      ),
    );

    return {
      success: true,
      deletedKeys: keys,
    };
  }

  /**
   * 다중 파일 업로드 처리
   * Promise.all을 사용하여 여러 파일을 병렬로 업로드
   */
  async uploadFiles(files: Express.Multer.File[], userId: number) {
    return this.uploadToBucket(files, userId, this.postBucket, 'uploads');
  }

  async uploadProfileImage(file: Express.Multer.File, userId: number) {
    return this.uploadToBucket([file], userId, this.postBucket, 'profiles');
  }
  /**
   * 다중 파일 삭제 처리
   * Promise.all을 사용하여 여러 파일을 병렬로 삭제
   */
  async deleteFiles(keys: string[]) {
    return this.deleteFromBucket(keys, this.postBucket);
  }

  async deleteProfileFiles(keys: string[]) {
    return this.deleteFromBucket(keys, this.postBucket);
  }
}
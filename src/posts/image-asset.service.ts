import { BadRequestException, Injectable } from '@nestjs/common';
import { ImageAssetRepository } from './image-asset.repository';

@Injectable()
export class ImageAssetService {
  constructor(private readonly imageAssetRepository: ImageAssetRepository) {}

  async validatePostImageKeys(postId: number, keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    const existingRows = await this.imageAssetRepository.findKeysByPostId(postId, keys);
    const existingKeys = new Set(existingRows.map((row: { key: string; }) => row.key));
    const invalidKeys = keys.filter((key) => !existingKeys.has(key));

    if (invalidKeys.length > 0) {
      throw new BadRequestException('Some removedOldKeys do not belong to this post');
    }
  }
}
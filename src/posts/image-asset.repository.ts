import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';
import { DbClient } from '../infra/prisma/prisma.DbClientType';

@Injectable()
export class ImageAssetRepository {
  constructor(private readonly prisma: PrismaService) {}

  findKeysByPostId(postId: number, keys: string[], db: DbClient = this.prisma) {
    if (keys.length === 0) {
      return Promise.resolve([]);
    }

    return db.imageAsset.findMany({
      where: {
        postId,
        key: { in: keys },
      },
      select: {
        key: true,
      },
    });
  }

  deleteByKeys(postId: number, keys: string[], db: DbClient = this.prisma) {
    if (keys.length === 0) {
      return Promise.resolve({ count: 0 });
    }

    return db.imageAsset.deleteMany({
      where: {
        postId,
        key: { in: keys },
      },
    });
  }

  createMany(data: Prisma.ImageAssetCreateManyInput[], db: DbClient = this.prisma) {
    if (data.length === 0) {
      return Promise.resolve({ count: 0 });
    }

    return db.imageAsset.createMany({
      data,
    });
  }
}
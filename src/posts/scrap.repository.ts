import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';
import { DbClient } from '../infra/prisma/prisma.DbClientType';

const scrapSelect = {
  id: true,
  userId: true,
  postId: true,
  createdAt: true,
} satisfies Prisma.ScrapSelect;

type ScrapItem = Prisma.ScrapGetPayload<{
  select: typeof scrapSelect;
}>;

@Injectable()
export class ScrapRepository {
  constructor(private readonly prisma: PrismaService) {}

  findScrapByUserAndPost(userId: number, postId: number, db: DbClient = this.prisma): Promise<ScrapItem | null> {
    return db.scrap.findUnique({
      where: { userId_postId: { userId, postId } },
      select: scrapSelect,
    });
  }

  createScrap(userId: number, postId: number, db: DbClient = this.prisma): Promise<ScrapItem> {
    return db.scrap.create({
      data: {
        user: { connect: { id: userId } },
        post: { connect: { id: postId } },
      },
      select: scrapSelect,
    });
  }

  deleteScrap(userId: number, postId: number, db: DbClient = this.prisma): Promise<ScrapItem> {
    return db.scrap.delete({
      where: { userId_postId: { userId, postId } },
      select: scrapSelect,
    });
  }
}

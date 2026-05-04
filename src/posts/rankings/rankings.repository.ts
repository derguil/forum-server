import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { DbClient } from '../../infra/prisma/prisma.DbClientType';

const postSelect = {
  id: true,
  userId: true,
  forumId: true,
  title: true,
  content: true,
  commentCount: true,
  voteCount: true,
  scrapCount: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: true,
  deletedAt: true,
  images: {
    take: 1,
    select: {
      key: true,
      url: true,
    },
  },
  user: {
    select: {
      id: true,
      username: true,
    },
  }
} satisfies Prisma.PostSelect;

const rankingItemSelect = {
  id: true,
  rankingType: true,
  postId: true,
  score: true,
  calculatedAt: true,
  post: {
    select: postSelect
  }
} satisfies Prisma.RankingItemSelect;

type PostListItem = Prisma.PostGetPayload<{
  select: typeof postSelect;
}>;

type RankingItemListItem = Prisma.RankingItemGetPayload<{
  select: typeof rankingItemSelect;
}>;

@Injectable()
export class RankingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  deleteTrendPosts(db: DbClient = this.prisma) {
    return db.rankingItem.deleteMany({
      where: { rankingType: 'TREND' },
    });
  }

  getTrendPostsId(since: Date, db: DbClient = this.prisma) {
    return db.postVote.groupBy({
      by: ['postId'],
      where: {
        createdAt: {
          gte: since,
        },
      },
      _count: {
        postId: true,
      },
      orderBy: {
        _count: {
          postId: 'desc',
        },
      },
    });
  }

  createTrendPosts(data: Prisma.RankingItemCreateManyInput[], db: DbClient = this.prisma) {
    if (data.length === 0) {
      return Promise.resolve({ count: 0 });
    }

    return db.rankingItem.createMany({
      data,
    });
  }

  findTrendPosts(page: number, limit: number, db: DbClient = this.prisma): Promise<RankingItemListItem[]> {
    return db.rankingItem.findMany({
      where: { rankingType: 'TREND' },
      select: rankingItemSelect,
      orderBy: { calculatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findHotPosts(page: number, limit: number, db: DbClient = this.prisma): Promise<PostListItem[]> {
    return db.post.findMany({
      where: { voteCount: { gte: 10 } },
      select: postSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findBestPosts(page: number, limit: number, db: DbClient = this.prisma): Promise<PostListItem[]> {
    return db.post.findMany({
      where: { voteCount: { gte: 100 } },
      select: postSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
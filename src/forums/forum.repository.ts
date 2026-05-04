import { Injectable } from '@nestjs/common';
import { Forum, Prisma } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';
import { DbClient } from '../infra/prisma/prisma.DbClientType';

const forumSelect = {
  id: true,
  userId: true,
  title: true,
  createdAt: true,
} satisfies Prisma.ForumSelect;

type ForumListItem = Prisma.ForumGetPayload<{
  select: typeof forumSelect;
}>;

@Injectable()
export class ForumRepository {
  constructor(private readonly prisma: PrismaService) {}

  createForum(data: Prisma.ForumCreateInput, db: DbClient = this.prisma): Promise<ForumListItem> {
    return db.forum.create({
      data,
      select: forumSelect,
    });
  }

  findForums(db: DbClient = this.prisma): Promise<ForumListItem[]> {
    return db.forum.findMany({
      select: forumSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  findByForumId(forumId: number, db: DbClient = this.prisma): Promise<ForumListItem | null> {
    return db.forum.findUnique({
      where: { id: forumId },
      select: forumSelect,
    });
  }
}
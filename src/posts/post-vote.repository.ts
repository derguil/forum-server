import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';
import { DbClient } from '../infra/prisma/prisma.DbClientType';

const postVoteSelect = {
  id: true,
  userId: true,
  postId: true,
  voteDate: true,
  createdAt: true,
} satisfies Prisma.PostVoteSelect;

type PostVoteItem = Prisma.PostVoteGetPayload<{
  select: typeof postVoteSelect;
}>;

@Injectable()
export class PostVoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPostVoteByUserAndPost(userId: number, postId: number, date: string, db: DbClient = this.prisma): Promise<PostVoteItem | null> {
    return db.postVote.findUnique({
      where: { userId_postId_voteDate: { userId, postId, voteDate: date, } },
      select: postVoteSelect,
    });
  }

  createPostVote(userId: number, postId: number, date: string, db: DbClient = this.prisma): Promise<PostVoteItem> {
    return db.postVote.create({
      data: {
        user: { connect: { id: userId } },
        post: { connect: { id: postId } },
        voteDate: date,
      },
      select: postVoteSelect,
    });
  }

  deletePostVote(userId: number, postId: number, date: string, db: DbClient = this.prisma): Promise<PostVoteItem> {
    return db.postVote.delete({
      where: { userId_postId_voteDate: { userId, postId, voteDate: date } },
      select: postVoteSelect,
    });
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';
import { DbClient } from '../infra/prisma/prisma.DbClientType';

const commentSelect = {
  id: true,
  userId: true,
  postId: true,
  content: true,
  createdAt: true,
  isDeleted: true,
  deletedAt: true,
  user: {
    select: {
      id: true,
      username: true,
      profileImageKey: true,
      profileImageUrl: true,
    },
  },
} satisfies Prisma.CommentSelect;

type CommentListItem = Prisma.CommentGetPayload<{
  select: typeof commentSelect;
}>;

@Injectable()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  createcomment(data: Prisma.CommentCreateInput, db: DbClient = this.prisma): Promise<CommentListItem> {
    return db.comment.create({
      data,
      select: commentSelect,
    });
  }

  findCommentById(commentId: number, db: DbClient = this.prisma): Promise<CommentListItem | null> {
    return db.comment.findUnique({
      where: {
        id: commentId,
        isDeleted: false,
      },
      select: commentSelect,
    });
  }

  findCommentByIdIncludingDeleted(commentId: number, db: DbClient = this.prisma): Promise<CommentListItem | null> {
    return db.comment.findUnique({
      where: {
        id: commentId,
      },
      select: commentSelect,
    });
  }

  softDeleteCommentById(commentId: number, db: DbClient = this.prisma): Promise<CommentListItem> {
    return db.comment.update({
      where: {
        id: commentId,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
      select: commentSelect,
    });
  }

  softDeleteCommentsByPostId(postId: number, db: DbClient = this.prisma): Promise<{ count: number }> {
    return db.comment.updateMany({
      where: {
        postId,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../infra/prisma/prisma.service';
import { DbClient } from '../infra/prisma/prisma.DbClientType';

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

const postWithCommentsSelect = {
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
    select: {
      key: true,
      url: true,
    },
  },
  user: {
    select: {
      id: true,
      username: true,
      profileImageKey: true,
      profileImageUrl: true,
    },
  },
  comments: {
    where: {
      isDeleted: false,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
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
    },
  },
} satisfies Prisma.PostSelect;

type PostListItem = Prisma.PostGetPayload<{
  select: typeof postSelect;
}>;

type PostDetailItem = Prisma.PostGetPayload<{
  select: typeof postWithCommentsSelect;
}>;

@Injectable()
export class PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  createPost(data: Prisma.PostCreateInput, db: DbClient = this.prisma): Promise<PostListItem> {
    return db.post.create({
      data,
      select: postSelect,
    });
  }

  findPostsByForumId(forumId: number, page: number, limit: number, db: DbClient = this.prisma): Promise<PostListItem[]> {
    return db.post.findMany({
      where: { forumId, isDeleted: false },
      select: postSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findPostByPostId(postId: number, db: DbClient = this.prisma): Promise<PostDetailItem | null> {
    return db.post.findFirst({
      where: {
        id: postId,
        isDeleted: false,
      },
      select: postWithCommentsSelect,
    });
  }

  updatePost(postId: number, data: Prisma.PostUpdateInput, db: DbClient = this.prisma): Promise<PostListItem> {
    return db.post.update({
      where: { id: postId },
      data,
      select: postSelect,
    });
  }

  incrementCommentCount(postId: number, db: DbClient = this.prisma): Promise<PostListItem> {
    return db.post.update({
      where: { id: postId },
      data: {
        commentCount: {
          increment: 1,
        },
      },
      select: postSelect,
    });
  }

  decrementCommentCount(postId: number, db: DbClient = this.prisma): Promise<PostListItem> {
    return db.post.update({
      where: { id: postId },
      data: {
        commentCount: {
          decrement: 1,
        },
      },
      select: postSelect,
    });
  }

  incrementVoteCount(postId: number, db: DbClient = this.prisma): Promise<PostListItem> {
    return db.post.update({
      where: { id: postId },
      data: {
        voteCount: {
          increment: 1,
        },
      },
      select: postSelect,
    });
  }

  decrementVoteCount(postId: number, db: DbClient = this.prisma): Promise<PostListItem> {
    return db.post.update({
      where: { id: postId },
      data: {
        voteCount: {
          decrement: 1,
        },
      },
      select: postSelect,
    });
  }

  incrementScrapCount(postId: number, db: DbClient = this.prisma): Promise<PostListItem> {
    return db.post.update({
      where: { id: postId },
      data: {
        scrapCount: {
          increment: 1,
        },
      },
      select: postSelect,
    });
  }

  decrementScrapCount(postId: number, db: DbClient = this.prisma): Promise<PostListItem> {
    return db.post.update({
      where: { id: postId },
      data: {
        scrapCount: {
          decrement: 1,
        },
      },
      select: postSelect,
    });
  }

  softDeletePostByPostId(postId: number, db: DbClient = this.prisma): Promise<PostListItem> {
    return db.post.update({
      where: { id: postId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
      select: postSelect,
    });
  }

  // hardDeletePostByPostId(postId: number): Promise<PostListItem> {
  //   return this.prisma.post.delete({
  //     where: { id: postId },
  //     select: postSelect,
  //   });
  // }
}
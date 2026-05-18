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
      profileImageKey: true,
      profileImageUrl: true,
    },
  },
  forum: {
    select: {
      id: true,
      title: true
    }
  }
} satisfies Prisma.PostSelect;

type PostListItem = Prisma.PostGetPayload<{
  select: typeof postSelect;
}>;

const myPageUserSelect = {
  id: true,
  username: true,
  email: true,
  profileImageKey: true,
  profileImageUrl: true,
} satisfies Prisma.UserSelect;

type MyPageUserRow = Prisma.UserGetPayload<{
  select: typeof myPageUserSelect;
}>;

const userCredentialSelect = {
  id: true,
  passwordHash: true,
} satisfies Prisma.UserSelect;

type UserCredentialRow = Prisma.UserGetPayload<{
  select: typeof userCredentialSelect;
}>;

@Injectable()
export class MeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserById(userId: number, db: DbClient = this.prisma): Promise<MyPageUserRow | null> {
    return db.user.findUnique({
      where: { id: userId },
      select: myPageUserSelect,
    });
  }

  findUserByUsername(username: string, db: DbClient = this.prisma): Promise<MyPageUserRow | null> {
    return db.user.findUnique({
      where: { username },
      select: myPageUserSelect,
    });
  }

  findUserByEmail(email: string, db: DbClient = this.prisma): Promise<MyPageUserRow | null> {
    return db.user.findUnique({
      where: { email },
      select: myPageUserSelect,
    });
  }

  updateUsername(userId: number, username: string, db: DbClient = this.prisma): Promise<MyPageUserRow> {
    return db.user.update({
      where: { id: userId },
      data: { username },
      select: myPageUserSelect,
    });
  }

  updateEmail(userId: number, email: string, db: DbClient = this.prisma): Promise<MyPageUserRow> {
    return db.user.update({
      where: { id: userId },
      data: { email },
      select: myPageUserSelect,
    });
  }

  updateProfileImage(userId: number, profileImageKey: string, profileImageUrl: string, db: DbClient = this.prisma): Promise<MyPageUserRow> {
    return db.user.update({
      where: { id: userId },
      data: {
        profileImageKey,
        profileImageUrl,
      },
      select: myPageUserSelect,
    });
  }

  findUserWithPasswordById(userId: number, db: DbClient = this.prisma): Promise<UserCredentialRow | null> {
    return db.user.findUnique({
      where: { id: userId },
      select: userCredentialSelect,
    });
  }

  updatePasswordAndLogout(userId: number, passwordHash: string, db: DbClient = this.prisma): Promise<UserCredentialRow> {
    return db.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        hashedRefreshToken: null,
      },
      select: userCredentialSelect,
    });
  }

  findPostsByUserId(userId: number, page: number, limit: number, db: DbClient = this.prisma): Promise<PostListItem[]> {
    return db.post.findMany({
      where: {
        userId,
        isDeleted: false,
      },
      select: postSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findPostsByComments(userId: number, page: number, limit: number, db: DbClient = this.prisma): Promise<PostListItem[]> {
    return db.post.findMany({
      where: {
        isDeleted: false,
        comments: {
          some: {
            userId,
            isDeleted: false,
          },
        },
      },
      select: postSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findPostsByScrap(userId: number, page: number, limit: number, db: DbClient = this.prisma): Promise<PostListItem[]> {
    return db.post.findMany({
      where: {
        isDeleted: false,
        scraps: {
          some: {
            userId,
          },
        },
      },
      select: postSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
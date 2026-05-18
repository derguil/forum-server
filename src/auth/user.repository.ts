import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { DbClient } from '../infra/prisma/prisma.DbClientType';

const userSelect = {
  id: true,
  username: true,
  email: true,
  passwordHash: true,
  hashedRefreshToken: true,
  createdAt: true,
  profileImageKey: true,
  profileImageUrl: true
} satisfies Prisma.UserSelect

type UserRow = Prisma.UserGetPayload<{
  select: typeof userSelect;
}>;

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  createUser(data: Prisma.UserCreateInput, db: DbClient = this.prisma): Promise<UserRow> {
    return db.user.create({
      data,
      select: userSelect
    });
  }

  findByUserId(userId: number, db: DbClient = this.prisma): Promise<UserRow | null> {
    return db.user.findUnique({
      where: { id: userId },
      select: userSelect
    });
  }

  findByIdWithRefreshToken(userId: number, db: DbClient = this.prisma) {
    return db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        hashedRefreshToken: true,
      },
    });
  }

  findByUsername(username: string, db: DbClient = this.prisma): Promise<UserRow | null> {
    return db.user.findUnique({
      where: { username },
      select: userSelect
    });
  }

  updateRefreshTokenHash(userId: number, hashedRefreshToken: string | null, db: DbClient = this.prisma): Promise<UserRow> {
    return db.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
      select: userSelect,
    });
  }
} 
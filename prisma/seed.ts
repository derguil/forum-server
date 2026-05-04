import { PrismaClient, RankingType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function upsertSeedUsers() {
  const seedPasswordHash = await bcrypt.hash('1234', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'seed-user-1@test.local' },
      update: {
        passwordHash: seedPasswordHash,
      },
      create: {
        username: 'seed_user_1',
        email: 'seed-user-1@test.local',
        passwordHash: seedPasswordHash,
      },
    }),
    prisma.user.upsert({
      where: { email: 'seed-user-2@test.local' },
      update: {
        passwordHash: seedPasswordHash,
      },
      create: {
        username: 'seed_user_2',
        email: 'seed-user-2@test.local',
        passwordHash: seedPasswordHash,
      },
    }),
    prisma.user.upsert({
      where: { email: 'seed-user-3@test.local' },
      update: {
        passwordHash: seedPasswordHash,
      },
      create: {
        username: 'seed_user_3',
        email: 'seed-user-3@test.local',
        passwordHash: seedPasswordHash,
      },
    }),
    prisma.user.upsert({
      where: { email: 'seed-user-4@test.local' },
      update: {
        passwordHash: seedPasswordHash,
      },
      create: {
        username: 'seed_user_4',
        email: 'seed-user-4@test.local',
        passwordHash: seedPasswordHash,
      },
    }),
    prisma.user.upsert({
      where: { email: 'seed-user-5@test.local' },
      update: {
        passwordHash: seedPasswordHash,
      },
      create: {
        username: 'seed_user_5',
        email: 'seed-user-5@test.local',
        passwordHash: seedPasswordHash,
      },
    }),
  ]);

  return users;
}

async function main() {
  const users = await upsertSeedUsers();
  const owner = users[0];

  const forum = await prisma.forum.upsert({
    where: { title: '랭킹 테스트 게시판' },
    update: {},
    create: {
      title: '랭킹 테스트 게시판',
      userId: owner.id,
    },
  });

  const posts = await Promise.all(
    Array.from({ length: 12 }).map((_, idx) => {
      const createdAt = new Date(Date.now() - idx * 10 * 60 * 1000);

      return prisma.post.create({
        data: {
          userId: users[idx % users.length].id,
          forumId: forum.id,
          title: `[seed] ranking test post ${Date.now()}-${idx + 1}`,
          content: '랭킹 기능 테스트용 더미 게시글입니다.',
          voteCount: 0,
          commentCount: idx % 4,
          scrapCount: idx % 3,
          createdAt,
        },
      });
    }),
  );

  for (let i = 0; i < posts.length; i += 1) {
    const post = posts[i];
    const voteTarget = Math.max(1, 12 - i);

    for (let j = 0; j < voteTarget; j += 1) {
      const voter = users[j % users.length];
      const dayOffset = Math.floor(j / users.length);
      const voteDate = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      await prisma.postVote.upsert({
        where: {
          userId_postId_voteDate: {
            userId: voter.id,
            postId: post.id,
            voteDate,
          },
        },
        update: {},
        create: {
          userId: voter.id,
          postId: post.id,
          voteDate,
        },
      });
    }

    await prisma.post.update({
      where: { id: post.id },
      data: {
        voteCount: voteTarget,
      },
    });
  }

  const trendPosts = posts.slice(0, 8);
  const hotPosts = posts.filter((p) => p.voteCount >= 10).slice(0, 8);
  const bestPosts = posts.filter((p) => p.voteCount >= 11).slice(0, 8);

  for (let i = 0; i < trendPosts.length; i += 1) {
    const post = trendPosts[i];
    await prisma.rankingItem.upsert({
      where: {
        rankingType_postId: {
          rankingType: RankingType.TREND,
          postId: post.id,
        },
      },
      update: {
        score: 100 - i,
        calculatedAt: new Date(),
      },
      create: {
        rankingType: RankingType.TREND,
        postId: post.id,
        score: 100 - i,
      },
    });
  }

  for (let i = 0; i < hotPosts.length; i += 1) {
    const post = hotPosts[i];
    await prisma.rankingItem.upsert({
      where: {
        rankingType_postId: {
          rankingType: RankingType.HOT,
          postId: post.id,
        },
      },
      update: {
        score: 80 - i,
        calculatedAt: new Date(),
      },
      create: {
        rankingType: RankingType.HOT,
        postId: post.id,
        score: 80 - i,
      },
    });
  }

  for (let i = 0; i < bestPosts.length; i += 1) {
    const post = bestPosts[i];
    await prisma.rankingItem.upsert({
      where: {
        rankingType_postId: {
          rankingType: RankingType.BEST,
          postId: post.id,
        },
      },
      update: {
        score: 120 - i,
        calculatedAt: new Date(),
      },
      create: {
        rankingType: RankingType.BEST,
        postId: post.id,
        score: 120 - i,
      },
    });
  }

  console.log('Seed complete');
  console.log(`forumId=${forum.id}`);
  console.log(`createdPosts=${posts.length}`);
  console.log(`trend=${trendPosts.length}, hot=${hotPosts.length}, best=${bestPosts.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

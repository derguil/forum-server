import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RankingsRepository } from './rankings.repository';
import { RankingType } from '@prisma/client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';

@Injectable()
export class TasksService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: WinstonLogger,
    private readonly rankingsRepository: RankingsRepository,
  ) {}

  // 1시간마다 한번
  @Cron(CronExpression.EVERY_HOUR)
  async rebuildRankings() {
    const { count: deleteTrendCount } = await this.rankingsRepository.deleteTrendPosts();
    this.logger.debug('deleted trend rankings', {
      context: TasksService.name,
      deletedCount: deleteTrendCount,
    });

    const since = new Date(Date.now() - 60 * 60 * 1000);   //1 시간
    const rows = await this.rankingsRepository.getTrendPostsId(since)
    const trend = rows.map((r) => ({
      rankingType: RankingType.TREND,
      postId: r.postId,
      score: r._count.postId,
    }));
    const { count: createTrendCount } = await this.rankingsRepository.createTrendPosts(trend)
    this.logger.info('created trend rankings', {
      context: TasksService.name,
      createdCount: createTrendCount,
      sourceCount: rows.length,
      since: since.toISOString(),
    });
  }
} 
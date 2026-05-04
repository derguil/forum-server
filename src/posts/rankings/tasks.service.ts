import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RankingsRepository } from './rankings.repository';
import { PostRepository } from '../post.repository';
import { RankingType } from '@prisma/client';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  
  constructor(
    private readonly rankingsRepository: RankingsRepository,
  ) {}

  // 1시간마다 한번
  @Cron(CronExpression.EVERY_HOUR)
  async rebuildRankings() {
    const { count: deleteTrendCount } = await this.rankingsRepository.deleteTrendPosts();
    this.logger.debug('deleted trend rankings: ' + deleteTrendCount);

    const since = new Date(Date.now() - 60 * 60 * 1000);   //1 시간
    const rows = await this.rankingsRepository.getTrendPostsId(since)
    const trend = rows.map((r) => ({
      rankingType: RankingType.TREND,
      postId: r.postId,
      score: r._count.postId,
    }));
    const { count: createTrendCount } = await this.rankingsRepository.createTrendPosts(trend)
    this.logger.debug('created trend rankings: ' + createTrendCount);   
  }
} 
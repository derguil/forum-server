import { Injectable } from '@nestjs/common';
import { GetRankingQueryDto } from './dto/get-ranking-query.dto';
import { Post, PrismaClient, RankingItem } from '@prisma/client';
import { RankingsRepository } from './rankings.repository';

@Injectable()
export class RankingsService {
  constructor(private readonly rankingsRepository: RankingsRepository) {}

  async getRankedPosts(getRankedPostsDto: GetRankingQueryDto): Promise<RankingItem[] | Post[]> {
    const { type, page, limit } = getRankedPostsDto;

    switch (type) {
      case 'TREND':
        return await this.rankingsRepository.findTrendPosts(page, limit);
      case 'HOT':
        return await this.rankingsRepository.findHotPosts(page, limit);
      case 'BEST':
        return await this.rankingsRepository.findBestPosts(page, limit);
      default:
        return await this.rankingsRepository.findTrendPosts(page, limit);
    }
  }
}

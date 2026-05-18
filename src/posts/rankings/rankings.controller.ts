import { Controller, Get, Query } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { GetRankingQueryDto } from './dto/get-ranking-query.dto';

@Controller('rankings')
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Get()
  getRankedPosts(@Query() getRankingQueryDto: GetRankingQueryDto) {
    return this.rankingsService.getRankedPosts(getRankingQueryDto);
  }
}

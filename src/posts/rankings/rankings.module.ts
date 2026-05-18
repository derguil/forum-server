import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { RankingsController } from './rankings.controller';
import { RankingsService } from './rankings.service';
import { RankingsRepository } from './rankings.repository';
import { PostVoteRepository } from '../post-vote.repository';
import { ScrapRepository } from '../scrap.repository';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [RankingsController],
  providers: [RankingsService, RankingsRepository, PostVoteRepository, ScrapRepository, TasksService],
})
export class RankingsModule {}
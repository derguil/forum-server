import { Module, forwardRef } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PostRepository } from './post.repository';
import { PrismaModule } from '../infra/prisma/prisma.module';
import { S3clientModule } from '../infra/s3client/s3client.module';
import { ForumsModule } from '../forums/forums.module';
import { ImageAssetRepository } from './image-asset.repository';
import { ImageAssetService } from './image-asset.service';
import { PostVoteRepository } from './post-vote.repository';
import { ScrapRepository } from './scrap.repository';
import { CommentsModule } from '../comments/comments.module';
import { OptionalJwtAccessGuard } from '../common/guards/optional-jwt-access.guard';
import { RankingsModule } from './rankings/rankings.module';

@Module({
  imports: [
    PrismaModule,
    S3clientModule,
    ForumsModule,
    forwardRef(() => CommentsModule),
    RankingsModule
  ],
  controllers: [PostsController],
  providers: [
    PostsService, 
    PostRepository, 
    ImageAssetRepository, 
    ImageAssetService, 
    PostVoteRepository, 
    ScrapRepository, 
    OptionalJwtAccessGuard,
  ],
  exports: [PostRepository],
})
export class PostsModule {}

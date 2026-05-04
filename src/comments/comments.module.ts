import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../infra/prisma/prisma.module';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { CommentRepository } from './comment.repository';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => PostsModule),
  ],
  controllers: [CommentsController],
  providers: [CommentsService, CommentRepository],
  exports: [CommentRepository],
})
export class CommentsModule {}
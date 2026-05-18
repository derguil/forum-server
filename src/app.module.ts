import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ForumsModule } from './forums/forums.module';
import { PostsModule } from './posts/posts.module';
import { MeModule } from './me/me.module';
import { CommentsModule } from './comments/comments.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'test'
          ? '.env.test'
          : '.env',
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    ForumsModule,
    PostsModule,
    CommentsModule,
    MeModule,
    EventsModule,
  ],
})
export class AppModule {}

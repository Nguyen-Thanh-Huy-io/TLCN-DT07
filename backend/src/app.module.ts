import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { BlogModule } from './blog/blog.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { RedisModule } from './common/modules/redis.module';
import { RateLimitModule } from './common/modules/rate-limit.module';
import { MetricsModule } from './metrics/metrics.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/config/winston.config';
import { LoggerModule } from './common/modules/logger.module';

import { TopicModule } from './topic/topic.module';
import { LessonModule } from './lesson/lesson.module';
import { TagModule } from './tag/tag.module';
import { ContentRevisionModule } from './content-revision/content-revision.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadModule } from './upload/upload.module';
import { LearningPathModule } from './learning-path/learning-path.module';
import { PublicContentModule } from './public-content/public-content.module';
import { CategoryModule } from './category/category.module';
import { ArticleModule } from './article/article.module';
import { TimelineModule } from './timeline/timeline.module';
import { QuizModule } from './quiz/quiz.module';
import { LearnerModule } from './learner/learner.module';
import { DiscussionModule } from './discussion/discussion.module';
import { NotificationModule } from './notification/notification.module';
import { NoteModule } from './note/note.module';

@Module({
  imports: [
    // Load environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Winston logger module (global - can be injected anywhere)
    WinstonModule.forRoot(winstonConfig),
    // Custom logger module (global - can be injected anywhere)
    LoggerModule,
    // Redis module (global - can be injected anywhere)
    RedisModule,
    // Rate limiting module (global - throttles requests using Redis)
    RateLimitModule,
    // Metrics module (global - Prometheus metrics)
    MetricsModule,
    AuthModule,
    UserModule,
    TopicModule,
    LessonModule,
    TagModule,
    ContentRevisionModule,
    DashboardModule,
    UploadModule,
    LearningPathModule,
    CategoryModule,
    ArticleModule,
    TimelineModule,
    PublicContentModule,
    QuizModule,
    LearnerModule,
    DiscussionModule,
    NotificationModule,
    NoteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

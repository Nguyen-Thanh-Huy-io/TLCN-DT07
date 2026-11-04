import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../common/services/prisma.service';
import { RedisService } from '../common/services/redis.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, RedisService],
  exports: [UserService],
})
export class UserModule {}

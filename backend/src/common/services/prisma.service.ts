import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import config from '../config/app.config';
import { CustomLoggerService } from './custom-logger.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly customLogger: CustomLoggerService) {
    const adapter = new PrismaPg({
      connectionString: config.database_url,
    });

    super({ adapter });
  }

  async onModuleInit() {
    this.customLogger.log('Connecting to database...', 'PrismaService');
    await this.$connect();
    this.customLogger.log('Database connected successfully', 'PrismaService');
  }

  async onModuleDestroy() {
    this.customLogger.log('Disconnecting from database...', 'PrismaService');
    await this.$disconnect();
    this.customLogger.log('Database disconnected', 'PrismaService');
  }
}

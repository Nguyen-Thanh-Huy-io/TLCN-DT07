import { Module } from '@nestjs/common';
import { BlogGateway } from './blog.gateway';

@Module({
  providers: [BlogGateway],
  exports: [BlogGateway],
})
export class BlogGatewayModule {}

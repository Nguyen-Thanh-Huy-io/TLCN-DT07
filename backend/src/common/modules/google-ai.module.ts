import { Global, Module } from '@nestjs/common';
import { GoogleAiService } from '../services/google-ai.service';

@Global()
@Module({
  providers: [GoogleAiService],
  exports: [GoogleAiService],
})
export class GoogleAiModule {}

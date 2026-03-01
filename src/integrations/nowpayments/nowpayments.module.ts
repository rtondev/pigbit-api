import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NowpaymentsService } from './nowpayments.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [NowpaymentsService],
  exports: [NowpaymentsService],
})
export class NowpaymentsModule {}

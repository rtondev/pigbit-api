import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookEvent } from '../../entities/webhook-event.entity';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WebhookEventsController } from './webhook-events.controller';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { NowpaymentsModule } from '../../integrations/nowpayments/nowpayments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEvent]),
    InvoicesModule,
    NowpaymentsModule,
    ApiKeysModule,
  ],
  controllers: [WebhooksController, WebhookEventsController],
  providers: [WebhooksService],
})
export class WebhooksModule {}

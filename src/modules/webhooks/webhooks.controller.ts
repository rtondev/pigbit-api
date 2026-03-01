import { Controller, Post, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';
import { NowpaymentsService } from '../../integrations/nowpayments/nowpayments.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private webhooksService: WebhooksService,
    private nowpayments: NowpaymentsService,
  ) {}

  @Post('nowpayments')
  @ApiExcludeEndpoint()
  async handleNowpayments(
    @Req() req: RawBodyRequest<Request> & { rawBody?: Buffer },
    @Headers('x-nowpayments-sig') signature: string,
  ) {
    const rawBody =
      req.rawBody?.toString() ?? JSON.stringify(req.body ?? {});
    const payload = rawBody;
    const isValid = this.nowpayments.verifyWebhookSignature(payload, signature ?? '');

    await this.webhooksService.processNowpayments(payload, isValid);
    return { received: true };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookEvent } from '../../entities/webhook-event.entity';
import { InvoicesService } from '../invoices/invoices.service';
import { paginate, PaginatedResponse } from '../../common/interfaces/pagination.interface';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(WebhookEvent)
    private webhookRepo: Repository<WebhookEvent>,
    private invoicesService: InvoicesService,
  ) {}

  async processNowpayments(payloadRaw: string, isValidSignature: boolean): Promise<void> {
    await this.webhookRepo.save({
      paymentId: this.extractPaymentId(payloadRaw),
      payloadRaw,
      isValidSignature,
      processedAt: isValidSignature ? new Date() : undefined,
    });

    if (!isValidSignature) return;

    const payload = JSON.parse(payloadRaw);
    const paymentId = payload.payment_id ?? payload.paymentId;
    const status = payload.payment_status ?? payload.status;
    const txHash =
      payload.payin_hash ?? payload.payout_hash ?? payload.tx_hash ?? payload.outcome_hash;
    const rawLink =
      payload.explorer_link ?? payload.payin_extra_id ?? payload.outcome_extra_id;
    const linkExplorer =
      typeof rawLink === 'string' && rawLink.startsWith('http') ? rawLink : undefined;

    if (paymentId && status) {
      await this.invoicesService.updateStatus(
        paymentId,
        this.mapStatus(status),
        txHash,
        linkExplorer,
      );
    }
  }

  private extractPaymentId(payload: string): string {
    try {
      const obj = JSON.parse(payload);
      return obj.payment_id ?? obj.paymentId ?? '';
    } catch {
      return '';
    }
  }

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<WebhookEvent>> {
    const take = Math.min(Math.max(1, limit || 20), 100);
    const [data, total] = await this.webhookRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * take,
      take,
    });
    return paginate(data, total, page, take);
  }

  private mapStatus(status: string): string {
    const map: Record<string, string> = {
      waiting: 'waiting',
      confirming: 'confirming',
      confirmed: 'confirmed',
      sending: 'sending',
      finished: 'finished',
      failed: 'failed',
      refunded: 'refunded',
      expired: 'expired',
    };
    return map[status.toLowerCase()] ?? status;
  }
}

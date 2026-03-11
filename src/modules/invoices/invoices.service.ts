import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { isAxiosError } from 'axios';
import { paginate, PaginatedResponse } from '../../common/interfaces/pagination.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../../entities/invoice.entity';
import { Transaction } from '../../entities/transaction.entity';
import { Product } from '../../entities/product.entity';
import { NowpaymentsService } from '../../integrations/nowpayments/nowpayments.service';
import { ProductsService } from '../products/products.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  INVOICE_STATUS_UPDATED,
  InvoiceStatusPayload,
} from '../../realtime/realtime.events';

const TAXA_PLATAFORMA = 0.01;
const INVOICE_EXPIRY_MINUTES = 15;

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    private nowpayments: NowpaymentsService,
    private productsService: ProductsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getCurrencies(): Promise<string[]> {
    return this.nowpayments.getCurrencies();
  }

  async create(userId: string, dto: CreateInvoiceDto): Promise<Invoice> {
    let valorBrl = dto.valorBrl;
    if (dto.productId) {
      const product = await this.productsService.findOne(
        dto.productId,
        userId,
      );
      valorBrl = parseFloat(product.valorBrl);
    }

    const taxaPlataforma = valorBrl * TAXA_PLATAFORMA;
    let nowResponse;
    try {
      nowResponse = await this.nowpayments.createPayment({
        price_amount: valorBrl,
        price_currency: 'brl',
        pay_currency: dto.moedaCripto.toLowerCase(),
      });
    } catch (err) {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        const msg = (err.response?.data as { message?: string })?.message;
        if (status === 403) {
          throw new BadRequestException(
            'Acesso negado pela NowPayments (403). Verifique NOWPAYMENTS_API_KEY no .env e se sua conta está ativa. Para testes, use NOWPAYMENTS_API_URL=https://api-sandbox.nowpayments.io/v1',
          );
        }
        if (status === 401) {
          throw new BadRequestException(
            'Chave da NowPayments inválida. Verifique NOWPAYMENTS_API_KEY no .env',
          );
        }
        throw new BadRequestException(
          msg || `Erro NowPayments (${status || 'desconhecido'}): ${err.message}`,
        );
      }
      throw err;
    }

    const r = nowResponse as Record<string, unknown>;
    const payAmount = nowResponse.pay_amount ?? r.payAmount ?? r.pay_amount;
    const paymentId = nowResponse.payment_id ?? r.paymentId ?? r.payment_id;
    const payAddress = nowResponse.pay_address ?? r.payAddress ?? r.pay_address;
    const paymentStatus = nowResponse.payment_status ?? r.paymentStatus ?? r.payment_status ?? r.status ?? 'waiting';

    if (payAmount == null || paymentId == null || payAddress == null) {
      const missing = [
        payAmount == null && 'pay_amount',
        paymentId == null && 'payment_id',
        payAddress == null && 'pay_address',
      ].filter(Boolean);
      const hint = r?.invoice_url ? 'A API retornou invoice_url (endpoint /invoice). Use POST /payment.' : '';
      throw new BadRequestException(
        `Resposta inválida da NowPayments: faltando ${missing.join(', ')}. ` +
        `Produção: api.nowpayments.io | Sandbox: api-sandbox.nowpayments.io. Use a API key do mesmo ambiente. ${hint}`,
      );
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + INVOICE_EXPIRY_MINUTES);

    const cotacao = Number(payAmount) > 0 ? valorBrl / Number(payAmount) : 0;

    const invoice = await this.invoiceRepo.save({
      userId,
      productId: dto.productId,
      valorBrl: String(valorBrl ?? 0),
      valorCripto: String(payAmount),
      moedaCripto: dto.moedaCripto,
      taxaGateway: '0',
      taxaPlataforma: String(taxaPlataforma ?? 0),
      cotacaoMomento: String(cotacao),
      paymentId: String(paymentId),
      payAddress: String(payAddress),
      status: String(paymentStatus),
      expiresAt,
    });

    return invoice;
  }

  async findByPaymentId(paymentId: string): Promise<Invoice | null> {
    return this.invoiceRepo.findOne({ where: { paymentId } });
  }

  async findById(id: string, userId?: string): Promise<Invoice> {
    const where: Record<string, string> = { id };
    if (userId) where.userId = userId;
    const invoice = await this.invoiceRepo.findOne({
      where,
      relations: ['product', 'transaction'],
    });
    if (!invoice) throw new NotFoundException('Invoice não encontrado');
    return invoice;
  }

  async findAllByUser(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Invoice>> {
    const [data, total] = await this.invoiceRepo.findAndCount({
      where: { userId },
      relations: ['product', 'transaction'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: Math.min(limit, 100),
    });
    return paginate(data, total, page, limit);
  }

  async updateStatus(
    paymentId: string,
    status: string,
    txHash?: string,
    linkExplorer?: string,
  ): Promise<Invoice> {
    const invoice = await this.findByPaymentId(paymentId);
    if (!invoice) throw new NotFoundException('Invoice não encontrado');

    await this.invoiceRepo.update(
      { paymentId },
      {
        status,
        ...(txHash && { updatedAt: new Date() }),
      },
    );

    if (['finished', 'confirmed', 'sending'].includes(status)) {
      const tx = await this.transactionRepo.findOne({
        where: { invoiceId: invoice.id },
      });
      const explorer =
        linkExplorer || (txHash && this.buildExplorerLink(invoice.moedaCripto, txHash));
      if (!tx) {
        await this.transactionRepo.save({
          invoiceId: invoice.id,
          status,
          valorBrl: invoice.valorBrl,
          valorCripto: invoice.valorCripto,
          hashTransacao: txHash ?? undefined,
          linkExplorer: explorer ?? undefined,
          confirmedAt: new Date(),
        });
      } else if (txHash && (!tx.hashTransacao || !tx.linkExplorer)) {
        await this.transactionRepo.update(
          { invoiceId: invoice.id },
          {
            hashTransacao: txHash,
            ...(explorer && { linkExplorer: explorer }),
          },
        );
      }
    }

    const updated = await this.findById(invoice.id);
    const payload: InvoiceStatusPayload = {
      paymentId,
      status,
      txHash,
    };
    this.eventEmitter.emit(INVOICE_STATUS_UPDATED, payload);
    return updated;
  }

  private buildExplorerLink(moedaCripto: string, hash: string): string {
    const m = (moedaCripto || '').toLowerCase();
    if (m.includes('btc')) return `https://blockchair.com/bitcoin/transaction/${hash}`;
    if (m.includes('eth')) return `https://etherscan.io/tx/${hash}`;
    if (m.includes('trx') || m.includes('usdttrc20') || m.includes('usdttrc'))
      return `https://tronscan.org/#/transaction/${hash}`;
    if (m.includes('ltc')) return `https://blockchair.com/litecoin/transaction/${hash}`;
    if (m.includes('doge')) return `https://blockchair.com/dogecoin/transaction/${hash}`;
    return `https://blockchair.com/search?q=${hash}`;
  }

  async cancel(id: string, userId: string): Promise<Invoice> {
    const invoice = await this.findById(id, userId);
    const cancelable = ['waiting', 'confirming'];
    if (!cancelable.includes(invoice.status)) {
      throw new BadRequestException(
        `Invoice não pode ser cancelado (status: ${invoice.status})`,
      );
    }
    await this.invoiceRepo.update(
      { id, userId },
      { status: 'expired', updatedAt: new Date() },
    );
    const cancelled = await this.findById(id, userId);
    if (cancelled.paymentId) {
      this.eventEmitter.emit(INVOICE_STATUS_UPDATED, {
        paymentId: cancelled.paymentId,
        status: 'expired',
      });
    }
    return cancelled;
  }

  async getCheckoutData(paymentId: string) {
    const invoice = await this.findByPaymentId(paymentId);
    if (!invoice) throw new NotFoundException('Invoice não encontrado');
    if (invoice.status === 'expired')
      throw new BadRequestException('Invoice expirado');
    if (new Date() > invoice.expiresAt) {
      await this.invoiceRepo.update(
        { paymentId },
        { status: 'expired', updatedAt: new Date() },
      );
      throw new BadRequestException('Invoice expirado');
    }
    return {
      paymentId: invoice.paymentId,
      valorBrl: invoice.valorBrl,
      payAddress: invoice.payAddress,
      payAmount: invoice.valorCripto,
      moedaCripto: invoice.moedaCripto,
      status: invoice.status,
      expiresAt: invoice.expiresAt,
    };
  }
}

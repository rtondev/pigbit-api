import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Invoice } from '../../entities/invoice.entity';
import { Transaction } from '../../entities/transaction.entity';
import { paginate, PaginatedResponse } from '../../common/interfaces/pagination.interface';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
  ) {}

  async getMetrics(userId: string) {
    const invoices = await this.invoiceRepo.find({
      where: { userId },
    });
    const volumeBrl = invoices.reduce(
      (sum, i) => sum + parseFloat(i.valorBrl),
      0,
    );
    const taxasPlataforma = invoices.reduce(
      (sum, i) => sum + parseFloat(i.taxaPlataforma),
      0,
    );
    const finished = invoices.filter((i) =>
      ['finished', 'confirmed', 'sending'].includes(i.status),
    );
    const pending = invoices.filter((i) =>
      ['waiting', 'confirming'].includes(i.status),
    );
    const expired = invoices.filter((i) => i.status === 'expired');

    return {
      volumeTransacionado: volumeBrl,
      numeroVendas: finished.length,
      taxasPagas: taxasPlataforma,
      status: {
        finished: finished.length,
        pending: pending.length,
        expired: expired.length,
      },
    };
  }

  async getTransactions(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Record<string, unknown>>> {
    const qb = this.transactionRepo
      .createQueryBuilder('t')
      .innerJoin('t.invoice', 'i')
      .where('i.userId = :userId', { userId })
      .select([
        't.id',
        't.invoiceId',
        't.hashTransacao',
        't.linkExplorer',
        't.status',
        't.valorBrl',
        't.valorCripto',
        't.confirmedAt',
        't.createdAt',
      ])
      .orderBy('t.createdAt', 'DESC');

    const [transactions, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const invoiceIds = [...new Set(transactions.map((t) => t.invoiceId))];
    const invoices = invoiceIds.length
      ? await this.invoiceRepo.find({
          where: { id: In(invoiceIds) },
        })
      : [];
    const invoiceMap = new Map(invoices.map((i) => [i.id, i]));

    const data = transactions.map((t) => {
      const inv = invoiceMap.get(t.invoiceId);
      return {
        ...t,
        taxaPlataforma: inv?.taxaPlataforma,
        moedaCripto: inv?.moedaCripto,
      };
    });
    return paginate(data, total, page, limit);
  }

  async getTransactionById(id: string, userId: string) {
    const transaction = await this.transactionRepo.findOne({
      where: { id },
      relations: ['invoice'],
    });
    if (!transaction) throw new NotFoundException('Transação não encontrada');
    if (transaction.invoice.userId !== userId) {
      throw new NotFoundException('Transação não encontrada');
    }
    const inv = transaction.invoice;
    return {
      id: transaction.id,
      invoiceId: transaction.invoiceId,
      hashTransacao: transaction.hashTransacao,
      linkExplorer: transaction.linkExplorer,
      status: transaction.status,
      valorBrl: transaction.valorBrl,
      valorCripto: transaction.valorCripto,
      confirmedAt: transaction.confirmedAt,
      createdAt: transaction.createdAt,
      taxaPlataforma: inv.taxaPlataforma,
      moedaCripto: inv.moedaCripto,
    };
  }
}

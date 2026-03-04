import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Transaction } from './entities/transaction.entity';
import { Invoice } from './entities/invoice.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Transaction) private transactionRepo: Repository<Transaction>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
  ) {}

  getHello(): string {
    return 'PIGBIT API - Pagamentos em Criptomoedas';
  }

  async getPublicStats() {
    try {
      // Total de usuários/clientes
      const totalUsers = await this.userRepo.count();

      // Total de transações confirmadas
      const totalTransactions = await this.transactionRepo.count({
        where: { status: 'confirmed' },
      });

      // Total de faturas processadas
      const totalInvoices = await this.invoiceRepo.count();

      // Volume total em BRL (sum de todas as transações confirmadas)
      const volumeResult = await this.transactionRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(CAST(t.amountBrl AS FLOAT)), 0)', 'total')
        .where("t.status = :status", { status: 'confirmed' })
        .getRawOne();

      const totalVolumeBrl = Math.round(parseFloat(volumeResult?.total || '0') * 100) / 100;

      return {
        totalClients: totalUsers,
        totalTransactions: totalTransactions,
        totalInvoices: totalInvoices,
        totalVolumeBrl: totalVolumeBrl,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas públicas:', error);
      return {
        totalClients: 0,
        totalTransactions: 0,
        totalInvoices: 0,
        totalVolumeBrl: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

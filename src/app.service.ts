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
      // Total de usuários/clientes registrados
      const totalUsers = await this.userRepo
        .createQueryBuilder('u')
        .select('COUNT(u.id)', 'count')
        .getRawOne();
      
      const totalClients = parseInt(totalUsers?.count || '0', 10);

      // Total de transações
      const totalTransactions = await this.transactionRepo
        .createQueryBuilder('t')
        .select('COUNT(t.id)', 'count')
        .getRawOne();
      
      const totalTx = parseInt(totalTransactions?.count || '0', 10);

      // Total de faturas
      const totalInvoices = await this.invoiceRepo
        .createQueryBuilder('i')
        .select('COUNT(i.id)', 'count')
        .getRawOne();
      
      const totalInv = parseInt(totalInvoices?.count || '0', 10);

      // Volume total em BRL (coluna valor_brl na entidade Transaction)
      const volumeResult = await this.transactionRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(CAST(t.valorBrl AS FLOAT)), 0)', 'total')
        .getRawOne();

      const totalVolumeBrl = Math.round(parseFloat(volumeResult?.total || '0') * 100) / 100;

      return {
        totalClients: totalClients,
        totalTransactions: totalTx,
        totalInvoices: totalInv,
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

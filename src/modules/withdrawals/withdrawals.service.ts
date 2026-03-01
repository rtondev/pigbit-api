import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { paginate, PaginatedResponse } from '../../common/interfaces/pagination.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Withdrawal } from '../../entities/withdrawal.entity';
import { Wallet } from '../../entities/wallet.entity';
import { WalletsService } from '../wallets/wallets.service';
import { AuditService } from '../../common/services/audit.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto';

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(Withdrawal)
    private withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(Wallet)
    private walletRepo: Repository<Wallet>,
    private walletsService: WalletsService,
    private auditService: AuditService,
  ) {}

  async create(userId: string, dto: CreateWithdrawalDto, ip?: string): Promise<Withdrawal> {
    const wallet = await this.walletsService.findOne(dto.walletId, userId);
    if (!wallet.ativo) throw new BadRequestException('Carteira inativa');

    const feeApplied = 0;
    const securityAlert = false;

    const withdrawal = await this.withdrawalRepo.save({
      userId,
      walletId: dto.walletId,
      amountBrl: dto.amountBrl.toString(),
      feeApplied: feeApplied.toString(),
      status: 'pending',
      securityAlert,
    });
    await this.auditService.log(userId, 'saque_solicitado', ip, undefined, {
      withdrawalId: withdrawal.id,
      amountBrl: dto.amountBrl,
      walletId: dto.walletId,
    });
    return withdrawal;
  }

  async findAllByUser(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Withdrawal>> {
    const [data, total] = await this.withdrawalRepo.findAndCount({
      where: { userId },
      relations: ['wallet'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: Math.min(limit, 100),
    });
    return paginate(data, total, page, limit);
  }

  async findOne(id: string, userId: string): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalRepo.findOne({
      where: { id, userId },
      relations: ['wallet'],
    });
    if (!withdrawal) throw new NotFoundException('Saque não encontrado');
    return withdrawal;
  }

  async update(id: string, userId: string, dto: UpdateWithdrawalDto, ip?: string): Promise<Withdrawal> {
    const withdrawal = await this.findOne(id, userId);

    const canProgress = ['pending', 'processing'].includes(withdrawal.status);
    if (dto.status && !canProgress && dto.status !== withdrawal.status) {
      throw new BadRequestException(
        `Saque em status "${withdrawal.status}" não pode ser alterado para "${dto.status}"`,
      );
    }

    const updates: { status?: string; txHash?: string } = {};
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.txHash !== undefined) updates.txHash = dto.txHash;

    if (Object.keys(updates).length > 0) {
      await this.withdrawalRepo.update({ id, userId }, updates);
      await this.auditService.log(userId, 'saque_atualizado', ip, undefined, {
        withdrawalId: id,
        ...updates,
      });
    }

    return this.findOne(id, userId);
  }
}

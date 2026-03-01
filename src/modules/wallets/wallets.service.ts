import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../../entities/wallet.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepo: Repository<Wallet>,
    private auditService: AuditService,
  ) {}

  async create(userId: string, dto: CreateWalletDto, ip?: string): Promise<Wallet> {
    const existing = await this.walletRepo.findOne({
      where: { userId, moeda: dto.moeda },
    });
    if (existing) {
      throw new ConflictException(`Carteira para ${dto.moeda} já existe`);
    }
    const wallet = await this.walletRepo.save({
      userId,
      endereco: dto.endereco,
      moeda: dto.moeda,
    });
    await this.auditService.log(userId, 'config_wallet', ip, undefined, {
      walletId: wallet.id,
      moeda: dto.moeda,
    });
    return wallet;
  }

  async findAllByUser(userId: string): Promise<Wallet[]> {
    return this.walletRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Wallet> {
    const wallet = await this.walletRepo.findOne({
      where: { id, userId },
    });
    if (!wallet) throw new NotFoundException('Carteira não encontrada');
    return wallet;
  }

  async update(id: string, userId: string, dto: UpdateWalletDto, ip?: string): Promise<Wallet> {
    const wallet = await this.findOne(id, userId);

    if (dto.moeda !== undefined && dto.moeda !== wallet.moeda) {
      const existing = await this.walletRepo.findOne({
        where: { userId, moeda: dto.moeda },
      });
      if (existing) {
        throw new ConflictException(`Carteira para ${dto.moeda} já existe`);
      }
    }

    await this.walletRepo.update(
      { id, userId },
      {
        ...(dto.endereco !== undefined && { endereco: dto.endereco }),
        ...(dto.moeda !== undefined && { moeda: dto.moeda }),
        ...(dto.ativo !== undefined && { ativo: dto.ativo }),
      },
    );

    const updated = await this.findOne(id, userId);
    await this.auditService.log(userId, 'config_wallet', ip, undefined, {
      acao: 'atualizacao',
      walletId: id,
      moeda: updated.moeda,
    });
    return updated;
  }

  async delete(id: string, userId: string, ip?: string): Promise<void> {
    const wallet = await this.findOne(id, userId);
    await this.walletRepo.delete({ id, userId });
    await this.auditService.log(userId, 'troca_wallet', ip, undefined, {
      acao: 'remocao',
      walletId: id,
      moeda: wallet.moeda,
    });
  }
}

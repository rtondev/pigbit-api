import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';
import { paginate, PaginatedResponse } from '../interfaces/pagination.interface';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async log(
    userId: string | null,
    acao: string,
    ip?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.auditRepo.save({
      userId: userId ?? undefined,
      acao,
      ip,
      userAgent,
      metadata,
    });
  }

  async findByUser(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<AuditLog>> {
    const [data, total] = await this.auditRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: Math.min(limit, 100),
    });
    return paginate(data, total, page, limit);
  }
}

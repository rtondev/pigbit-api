import * as crypto from 'crypto';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../../entities/api-key.entity';
import { User } from '../../entities/user.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

const KEY_PREFIX = 'pb_';
const KEY_BYTES = 32;

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepo: Repository<ApiKey>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(
    userId: string,
    dto: CreateApiKeyDto,
  ): Promise<{ apiKey: ApiKey; plainKey: string }> {
    const plainKey = this.generateKey();
    const keyHash = this.hashKey(plainKey);
    const keyPrefix = plainKey.substring(0, KEY_PREFIX.length + 8);

    const apiKey = await this.apiKeyRepo.save({
      userId,
      name: dto.name,
      keyPrefix,
      keyHash,
      allowedIps: dto.allowedIps?.length ? dto.allowedIps : null,
    });

    return {
      apiKey: await this.apiKeyRepo.findOneOrFail({ where: { id: apiKey.id } }),
      plainKey,
    };
  }

  async findAllByUser(userId: string): Promise<ApiKey[]> {
    return this.apiKeyRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      select: ['id', 'name', 'keyPrefix', 'allowedIps', 'lastUsedAt', 'createdAt'],
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const key = await this.apiKeyRepo.findOne({ where: { id, userId } });
    if (!key) throw new NotFoundException('Chave não encontrada');
    await this.apiKeyRepo.delete({ id, userId });
  }

  async validate(key: string, clientIp?: string): Promise<User | null> {
    if (!key?.startsWith(KEY_PREFIX) || key.length < 20) return null;

    const keyPrefix = key.substring(0, KEY_PREFIX.length + 8);
    const keys = await this.apiKeyRepo.find({
      where: { keyPrefix },
      relations: ['user'],
    });

    const keyHash = this.hashKey(key);
    const found = keys.find((k) => keyHash === k.keyHash);
    if (!found) return null;

    if (found.allowedIps?.length) {
      const ip = clientIp ?? '';
      const allowed = found.allowedIps.some(
        (a) => a === ip || a === '127.0.0.1',
      );
      if (!allowed) throw new UnauthorizedException('IP não autorizado');
    }

    await this.apiKeyRepo.update(
      { id: found.id },
      { lastUsedAt: new Date() },
    );

    return found.user;
  }

  private generateKey(): string {
    return KEY_PREFIX + crypto.randomBytes(KEY_BYTES).toString('hex');
  }

  private hashKey(plain: string): string {
    return crypto.createHash('sha256').update(plain).digest('hex');
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as speakeasy from 'speakeasy';
import { User } from '../../entities/user.entity';
import { SensitiveChangeCode } from '../../entities/sensitive-change-code.entity';
import { AuditService } from '../../common/services/audit.service';
import { EmailService } from '../../common/services/email.service';
import { UpdateEmailDto, UpdateCnpjDto } from './dto/update-sensitive.dto';

@Injectable()
export class UsersService {
  private readonly CODE_EXPIRY_MINUTES = 15;

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(SensitiveChangeCode)
    private sensitiveCodeRepo: Repository<SensitiveChangeCode>,
    private auditService: AuditService,
    private emailService: EmailService,
  ) {}

  async findById(id: string): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'cnpj',
        'telefone',
        'nomeFantasia',
        'razaoSocial',
        'endereco',
        'emailVerified',
        'twoFaEnabled',
      ],
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async update(
    id: string,
    data: { telefone?: string; nomeFantasia?: string },
    ip?: string,
  ): Promise<Partial<User>> {
    await this.userRepo.update(id, data);
    await this.auditService.log(id, 'alteracao_perfil', ip, undefined, data);
    return this.findById(id);
  }

  async requestSensitiveChange(userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.CODE_EXPIRY_MINUTES);
    await this.sensitiveCodeRepo.save({ userId, codigo, expiresAt });
    await this.emailService.sendVerificationCode(user.email, codigo);
    return { message: 'Código enviado ao e-mail' };
  }

  async updateEmail(userId: string, dto: UpdateEmailDto, ip?: string): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const existing = await this.userRepo.findOne({ where: { email: dto.novoEmail } });
    if (existing) throw new ConflictException('E-mail já em uso');
    const code = await this.sensitiveCodeRepo.findOne({
      where: { userId, codigo: dto.codigo },
    });
    if (!code || code.utilizado || code.expiresAt < new Date())
      throw new BadRequestException('Código inválido ou expirado');
    if (user.twoFaEnabled && dto.codigo2fa) {
      const valid = speakeasy.totp.verify({
        secret: user.twoFaSecret || '',
        encoding: 'base32',
        token: dto.codigo2fa,
        window: 1,
      });
      if (!valid) throw new BadRequestException('Código 2FA inválido');
    } else if (user.twoFaEnabled) {
      throw new BadRequestException('Código 2FA obrigatório');
    }
    await this.userRepo.update(userId, { email: dto.novoEmail });
    await this.sensitiveCodeRepo.update(code.id, { utilizado: true });
    await this.auditService.log(userId, 'alteracao_email', ip, undefined, {
      novoEmail: dto.novoEmail,
    });
    return this.findById(userId);
  }

  async updateCnpj(userId: string, dto: UpdateCnpjDto, ip?: string): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const existing = await this.userRepo.findOne({ where: { cnpj: dto.novoCnpj } });
    if (existing) throw new ConflictException('CNPJ já em uso');
    const code = await this.sensitiveCodeRepo.findOne({
      where: { userId, codigo: dto.codigo },
    });
    if (!code || code.utilizado || code.expiresAt < new Date())
      throw new BadRequestException('Código inválido ou expirado');
    if (user.twoFaEnabled && dto.codigo2fa) {
      const valid = speakeasy.totp.verify({
        secret: user.twoFaSecret || '',
        encoding: 'base32',
        token: dto.codigo2fa,
        window: 1,
      });
      if (!valid) throw new BadRequestException('Código 2FA inválido');
    } else if (user.twoFaEnabled) {
      throw new BadRequestException('Código 2FA obrigatório');
    }
    await this.userRepo.update(userId, { cnpj: dto.novoCnpj });
    await this.sensitiveCodeRepo.update(code.id, { utilizado: true });
    await this.auditService.log(userId, 'alteracao_cnpj', ip, undefined, {
      novoCnpj: dto.novoCnpj,
    });
    return this.findById(userId);
  }
}

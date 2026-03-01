import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { User } from '../../entities/user.entity';
import { FailedLoginAttempt } from '../../entities/failed-login-attempt.entity';
import { PasswordResetCode } from '../../entities/password-reset-code.entity';
import { PendingRegistration } from '../../entities/pending-registration.entity';
import { RegisterRequestDto } from './dto/register-request.dto';
import { RegisterConfirmDto } from './dto/register-confirm.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../../common/services/email.service';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class AuthService {
  private readonly MAX_ATTEMPTS = 3;
  private readonly LOCKOUT_MINUTES = 15;
  private readonly CODE_EXPIRY_MINUTES = 15;

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(FailedLoginAttempt)
    private failedAttemptRepo: Repository<FailedLoginAttempt>,
    @InjectRepository(PasswordResetCode)
    private passwordResetRepo: Repository<PasswordResetCode>,
    @InjectRepository(PendingRegistration)
    private pendingRegRepo: Repository<PendingRegistration>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private auditService: AuditService,
  ) {}

  async registerRequest(dto: RegisterRequestDto, ip?: string): Promise<{ message: string }> {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('E-mail já cadastrado');
    const existingCnpj = await this.userRepo.findOne({ where: { cnpj: dto.cnpj.replace(/\D/g, '') } });
    if (existingCnpj) throw new ConflictException('CNPJ já cadastrado');

    const hash = await bcrypt.hash(dto.password, 10);
    const cnpj = dto.cnpj.replace(/\D/g, '');
    const telefone = dto.telefone?.replace(/\D/g, '') ?? null;
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.CODE_EXPIRY_MINUTES);

    await this.pendingRegRepo.delete({ email: dto.email });
    await this.pendingRegRepo.save({
      email: dto.email,
      cnpj,
      telefone,
      nomeFantasia: dto.nomeFantasia ?? null,
      razaoSocial: dto.razaoSocial ?? null,
      endereco: dto.endereco ?? null,
      passwordHash: hash,
      codigo,
      expiresAt,
    });
    await this.emailService.sendVerificationCode(dto.email, codigo);
    return { message: 'Código enviado ao e-mail' };
  }

  async registerConfirm(dto: RegisterConfirmDto, ip?: string): Promise<{ user: Partial<User>; token: string }> {
    const pending = await this.pendingRegRepo.findOne({ where: { email: dto.email } });
    if (!pending) throw new BadRequestException('Solicite o código novamente');
    if (pending.codigo !== dto.codigo) throw new BadRequestException('Código inválido');
    if (pending.expiresAt < new Date()) throw new BadRequestException('Código expirado');

    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('E-mail já cadastrado');

    const user = await this.userRepo.save({
      email: pending.email,
      passwordHash: pending.passwordHash,
      cnpj: pending.cnpj,
      telefone: pending.telefone,
      nomeFantasia: pending.nomeFantasia,
      razaoSocial: pending.razaoSocial,
      endereco: pending.endereco,
      emailVerified: true,
    });
    await this.pendingRegRepo.delete({ email: dto.email });
    await this.auditService.log(user.id, 'criacao_conta', ip, undefined, {
      email: user.email,
    });

    return {
      user: { id: user.id, email: user.email, telefone: user.telefone, nomeFantasia: user.nomeFantasia },
      token: this.jwtService.sign({ sub: user.id, email: user.email }),
    };
  }

  async login(
    dto: LoginDto,
    ip?: string,
    userAgent?: string,
  ): Promise<{ user: Partial<User>; token: string } | { requires2fa: true; email: string }> {
    const attempt = await this.failedAttemptRepo.findOne({
      where: { email: dto.email },
    });

    if (attempt?.bloqueadoAte && attempt.bloqueadoAte > new Date()) {
      throw new UnauthorizedException(
        `Conta bloqueada. Tente novamente após ${this.LOCKOUT_MINUTES} minutos`,
      );
    }

    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      await this.recordFailedAttempt(dto.email, ip);
      await this.auditService.log(null, 'login_falha', ip, undefined, {
        email: dto.email,
        motivo: 'usuario_nao_encontrado',
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.recordFailedAttempt(dto.email, ip);
      await this.auditService.log(user.id, 'login_falha', ip, undefined, {
        motivo: 'senha_incorreta',
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.isLocked && user.lockoutExpiry && user.lockoutExpiry > new Date()) {
      throw new UnauthorizedException('Conta temporariamente bloqueada');
    }

    if (user.twoFaEnabled) {
      return { requires2fa: true, email: user.email };
    }

    if (attempt) {
      await this.failedAttemptRepo.delete({ email: dto.email });
    }
    await this.auditService.log(user.id, 'login', ip, undefined, {});

    return {
      user: {
        id: user.id,
        email: user.email,
        cnpj: user.cnpj,
        telefone: user.telefone,
        nomeFantasia: user.nomeFantasia,
      },
      token: this.jwtService.sign({ sub: user.id, email: user.email }),
    };
  }

  private async recordFailedAttempt(email: string, ip?: string): Promise<void> {
    let attempt = await this.failedAttemptRepo.findOne({
      where: { email },
    });

    if (!attempt) {
      attempt = await this.failedAttemptRepo.save({
        email,
        tentativas: 1,
        lastIp: ip ?? null,
      });
    } else {
      attempt.tentativas += 1;
      attempt.lastIp = ip ?? null;
      if (attempt.tentativas >= this.MAX_ATTEMPTS) {
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + this.LOCKOUT_MINUTES);
        attempt.bloqueadoAte = expiry;
      }
      await this.failedAttemptRepo.save(attempt);
    }

    if (attempt.tentativas >= this.MAX_ATTEMPTS) {
      throw new UnauthorizedException(
        `Muitas tentativas. Bloqueado por ${this.LOCKOUT_MINUTES} minutos`,
      );
    }
  }

  async validateUser(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async requestPasswordReset(email: string, ip?: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('E-mail não encontrado');
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.CODE_EXPIRY_MINUTES);
    await this.passwordResetRepo.save({
      userId: user.id,
      codigo,
      expiresAt,
    });
    await this.emailService.sendPasswordResetCode(user.email, codigo);
    return { message: 'Código enviado ao e-mail cadastrado' };
  }

  async resetPassword(
    email: string,
    codigo: string,
    novaSenha: string,
    ip?: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('E-mail não encontrado');
    const reset = await this.passwordResetRepo.findOne({
      where: { userId: user.id, codigo },
    });
    if (!reset) throw new BadRequestException('Código inválido');
    if (reset.utilizado)
      throw new BadRequestException('Código já utilizado');
    if (reset.expiresAt < new Date())
      throw new BadRequestException('Código expirado');
    const hash = await bcrypt.hash(novaSenha, 10);
    await this.userRepo.update(user.id, { passwordHash: hash });
    await this.passwordResetRepo.update(reset.id, { utilizado: true });
    await this.auditService.log(user.id, 'senha_alterada', ip, undefined, {});
    return { message: 'Senha alterada com sucesso' };
  }

  async enable2fa(userId: string, ip?: string): Promise<{ secret: string; qrCode: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.twoFaEnabled) throw new BadRequestException('2FA já ativado');
    const secret = speakeasy.generateSecret({
      name: `PIGBIT (${user.email})`,
      length: 32,
    });
    const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');
    await this.userRepo.update(userId, {
      twoFaSecret: secret.base32,
    });
    await this.auditService.log(userId, '2fa_ativacao', ip, undefined, {});
    return { secret: secret.base32, qrCode };
  }

  async verifyAndEnable2fa(userId: string, codigo: string, ip?: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.twoFaSecret)
      throw new BadRequestException('Gere o QR Code primeiro');
    const valid = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: 'base32',
      token: codigo,
      window: 1,
    });
    if (!valid) throw new BadRequestException('Código inválido');
    await this.userRepo.update(userId, { twoFaEnabled: true });
    await this.auditService.log(userId, '2fa_ativado', ip, undefined, {});
    return { message: '2FA ativado com sucesso' };
  }

  async disable2fa(userId: string, codigo: string, ip?: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.twoFaEnabled) throw new BadRequestException('2FA não ativado');
    const valid = speakeasy.totp.verify({
      secret: user.twoFaSecret || '',
      encoding: 'base32',
      token: codigo,
      window: 1,
    });
    if (!valid) throw new BadRequestException('Código inválido');
    await this.userRepo.update(userId, {
      twoFaEnabled: false,
      twoFaSecret: undefined,
    });
    await this.auditService.log(userId, '2fa_desativado', ip, undefined, {});
    return { message: '2FA desativado' };
  }

  async verify2fa(
    email: string,
    codigo: string,
    ip?: string,
  ): Promise<{ user: Partial<User>; token: string }> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !user.twoFaEnabled)
      throw new UnauthorizedException('2FA não configurado');
    const valid = speakeasy.totp.verify({
      secret: user.twoFaSecret || '',
      encoding: 'base32',
      token: codigo,
      window: 1,
    });
    if (!valid) throw new UnauthorizedException('Código 2FA inválido');
    await this.auditService.log(user.id, 'login', ip, undefined, { via: '2fa' });
    return {
      user: { id: user.id, email: user.email, cnpj: user.cnpj, telefone: user.telefone, nomeFantasia: user.nomeFantasia },
      token: this.jwtService.sign({ sub: user.id, email: user.email }),
    };
  }
}

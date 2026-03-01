import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Company } from './company.entity';
import { Product } from './product.entity';
import { Invoice } from './invoice.entity';
import { Wallet } from './wallet.entity';
import { Withdrawal } from './withdrawal.entity';
import { AuditLog } from './audit-log.entity';
import { EmailVerificationCode } from './email-verification-code.entity';
import { PasswordResetCode } from './password-reset-code.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', nullable: true })
  cnpj: string | null;

  @Column({ type: 'varchar', nullable: true })
  telefone: string | null;

  @Column({ name: 'nome_fantasia', type: 'varchar', nullable: true })
  nomeFantasia: string | null;

  @Column({ name: 'razao_social', type: 'varchar', nullable: true })
  razaoSocial: string | null;

  @Column({ type: 'varchar', nullable: true })
  endereco: string | null;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'two_fa_enabled', default: false })
  twoFaEnabled: boolean;

  @Column({ name: 'two_fa_secret', type: 'varchar', nullable: true })
  twoFaSecret: string | null;

  @Column({ name: 'email_verified_at', type: 'timestamp', nullable: true })
  emailVerifiedAt: Date;

  @Column({ name: 'is_locked', default: false })
  isLocked: boolean;

  @Column({ name: 'lockout_expiry', type: 'timestamp', nullable: true })
  lockoutExpiry: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Company, (c) => c.user)
  company: Company;

  @OneToMany(() => Product, (p) => p.user)
  products: Product[];

  @OneToMany(() => Invoice, (i) => i.user)
  invoices: Invoice[];

  @OneToMany(() => Wallet, (w) => w.user)
  wallets: Wallet[];

  @OneToMany(() => Withdrawal, (w) => w.user)
  withdrawals: Withdrawal[];

  @OneToMany(() => AuditLog, (a) => a.user)
  auditLogs: AuditLog[];

  @OneToMany(() => EmailVerificationCode, (e) => e.user)
  emailVerificationCodes: EmailVerificationCode[];

  @OneToMany(() => PasswordResetCode, (p) => p.user)
  passwordResetCodes: PasswordResetCode[];

}

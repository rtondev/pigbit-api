import {
  Entity,
  PrimaryColumn,
  Column,
} from 'typeorm';

@Entity('pending_registrations')
export class PendingRegistration {
  @PrimaryColumn()
  email: string;

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

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column()
  codigo: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;
}

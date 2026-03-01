import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('failed_login_attempts')
export class FailedLoginAttempt {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: string;

  @Column()
  email: string;

  @Column({ default: 0 })
  tentativas: number;

  @Column({ name: 'bloqueado_ate', type: 'timestamp', nullable: true })
  bloqueadoAte: Date;

  @Column({ name: 'last_ip', type: 'varchar', nullable: true })
  lastIp: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

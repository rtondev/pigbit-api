import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({ name: 'key_prefix', length: 12 })
  keyPrefix: string;

  @Column({ name: 'key_hash', length: 64 })
  keyHash: string;

  @Column({ name: 'allowed_ips', type: 'jsonb', nullable: true })
  allowedIps: string[] | null;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

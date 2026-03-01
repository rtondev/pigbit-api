import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Wallet } from './wallet.entity';

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'wallet_id' })
  walletId: string;

  @Column({ name: 'amount_brl', type: 'decimal', precision: 15, scale: 2 })
  amountBrl: string;

  @Column({ name: 'fee_applied', type: 'decimal', precision: 15, scale: 2 })
  feeApplied: string;

  @Column()
  status: string;

  @Column({ name: 'security_alert', default: false })
  securityAlert: boolean;

  @Column({ name: 'tx_hash', nullable: true })
  txHash: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (u) => u.withdrawals)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Wallet, (w) => w.withdrawals)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;
}

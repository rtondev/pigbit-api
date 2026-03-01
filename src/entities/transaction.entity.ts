import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: string;

  @Column({ name: 'invoice_id' })
  invoiceId: string;

  @Column({ name: 'hash_transacao', nullable: true })
  hashTransacao: string;

  @Column({ name: 'link_explorer', nullable: true })
  linkExplorer: string;

  @Column()
  status: string;

  @Column({ name: 'valor_brl', type: 'decimal', precision: 15, scale: 2 })
  valorBrl: string;

  @Column({ name: 'valor_cripto', type: 'decimal', precision: 18, scale: 8 })
  valorCripto: string;

  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => Invoice, (i) => i.transaction)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;
}

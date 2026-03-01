import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Product } from './product.entity';
import { Transaction } from './transaction.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'product_id', nullable: true })
  productId: string;

  @Column({ name: 'valor_brl', type: 'decimal', precision: 15, scale: 2 })
  valorBrl: string;

  @Column({ name: 'valor_cripto', type: 'decimal', precision: 18, scale: 8 })
  valorCripto: string;

  @Column({ name: 'moeda_cripto' })
  moedaCripto: string;

  @Column({ name: 'taxa_gateway', type: 'decimal', precision: 15, scale: 2 })
  taxaGateway: string;

  @Column({ name: 'taxa_plataforma', type: 'decimal', precision: 15, scale: 2 })
  taxaPlataforma: string;

  @Column({ name: 'cotacao_momento', type: 'decimal', precision: 18, scale: 8 })
  cotacaoMomento: string;

  @Column({ name: 'payment_id', unique: true })
  paymentId: string;

  @Column({ name: 'pay_address' })
  payAddress: string;

  @Column()
  status: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (u) => u.invoices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Product, (p) => p.invoices)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToOne(() => Transaction, (t) => t.invoice)
  transaction: Transaction;
}

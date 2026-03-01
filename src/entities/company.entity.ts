import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('identity', { type: 'bigint' })
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  cnpj: string;

  @Column({ name: 'razao_social' })
  razaoSocial: string;

  @Column({ name: 'nome_fantasia', nullable: true })
  nomeFantasia: string;

  @Column({ nullable: true })
  endereco: string;

  @Column({ nullable: true })
  cnae: string;

  @Column({ name: 'situacao_cadastral', nullable: true })
  situacaoCadastral: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, (u) => u.company)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

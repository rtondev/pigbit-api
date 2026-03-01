import { Injectable, NotFoundException } from '@nestjs/common';
import { paginate, PaginatedResponse } from '../../common/interfaces/pagination.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async create(userId: string, dto: CreateProductDto): Promise<Product> {
    return this.productRepo.save({
      userId,
      nome: dto.nome,
      descricao: dto.descricao,
      valorBrl: dto.valorBrl.toString(),
    });
  }

  async findAllByUser(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Product>> {
    const [data, total] = await this.productRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: Math.min(limit, 100),
    });
    return paginate(data, total, page, limit);
  }

  async findOne(id: string, userId: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, userId },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async update(
    id: string,
    userId: string,
    data: { nome?: string; descricao?: string; valorBrl?: number },
  ): Promise<Product> {
    await this.findOne(id, userId);
    const update: Record<string, string | undefined> = {};
    if (data.nome !== undefined) update.nome = data.nome;
    if (data.descricao !== undefined) update.descricao = data.descricao;
    if (data.valorBrl !== undefined) update.valorBrl = data.valorBrl.toString();
    await this.productRepo.update({ id, userId }, update);
    return this.findOne(id, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.productRepo.delete({ id, userId });
  }
}

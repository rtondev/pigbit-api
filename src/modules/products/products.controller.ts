import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-apikey.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtOrApiKeyGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastrar produto',
    description: 'Registra produto com nome, descrição e valor em BRL.',
  })
  @ApiResponse({ status: 201, description: 'Produto criado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(@CurrentUser() user: User, @Body() dto: CreateProductDto) {
    return this.productsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar produtos',
    description: 'Retorna produtos do lojista. Paginado.',
  })
  @ApiResponse({ status: 200, description: 'Lista de produtos' })
  findAll(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    return this.productsService.findAllByUser(user.id, p, l);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar produto',
    description: 'Retorna produto por ID.',
  })
  @ApiResponse({ status: 200, description: 'Produto encontrado' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productsService.findOne(id, user.id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Atualizar produto',
    description: 'Edita produto (RF-018)',
  })
  @ApiResponse({ status: 200, description: 'Produto atualizado' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Excluir produto',
    description: 'Remove produto cadastrado',
  })
  @ApiResponse({ status: 204, description: 'Produto excluído' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.productsService.delete(id, user.id);
  }
}

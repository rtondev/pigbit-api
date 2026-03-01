import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-apikey.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('wallets')
@ApiBearerAuth()
@Controller('wallets')
@UseGuards(JwtOrApiKeyGuard)
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Post()
  @ApiOperation({
    summary: 'Cadastrar carteira',
    description: 'Configura carteira de saque para moeda específica',
  })
  @ApiResponse({ status: 201, description: 'Carteira cadastrada' })
  @ApiResponse({ status: 409, description: 'Carteira para moeda já existe' })
  create(@CurrentUser() user: User, @Body() dto: CreateWalletDto, @Req() req: Request) {
    return this.walletsService.create(user.id, dto, req.ip);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar carteiras',
    description: 'Retorna carteiras de saque do lojista',
  })
  @ApiResponse({ status: 200, description: 'Lista de carteiras' })
  findAll(@CurrentUser() user: User) {
    return this.walletsService.findAllByUser(user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Editar carteira',
    description: 'Atualiza endereço, moeda ou status ativo da carteira',
  })
  @ApiResponse({ status: 200, description: 'Carteira atualizada' })
  @ApiResponse({ status: 404, description: 'Carteira não encontrada' })
  @ApiResponse({ status: 409, description: 'Carteira para moeda já existe' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateWalletDto,
    @Req() req: Request,
  ) {
    return this.walletsService.update(id, user.id, dto, req.ip);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover carteira',
    description: 'Remove carteira de saque',
  })
  @ApiResponse({ status: 204, description: 'Carteira removida' })
  @ApiResponse({ status: 404, description: 'Carteira não encontrada' })
  delete(@Param('id') id: string, @CurrentUser() user: User, @Req() req: Request) {
    return this.walletsService.delete(id, user.id, req.ip);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-apikey.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('withdrawals')
@ApiBearerAuth()
@Controller('withdrawals')
@UseGuards(JwtOrApiKeyGuard)
export class WithdrawalsController {
  constructor(private withdrawalsService: WithdrawalsService) {}

  @Post()
  @ApiOperation({
    summary: 'Solicitar saque',
    description: 'Requer senha e 2FA (RF-026). Alerta se saque > X% da média (RF-027)',
  })
  @ApiResponse({ status: 201, description: 'Saque solicitado' })
  @ApiResponse({ status: 400, description: 'Carteira inativa ou dados inválidos' })
  @ApiResponse({ status: 404, description: 'Carteira não encontrada' })
  create(@CurrentUser() user: User, @Body() dto: CreateWithdrawalDto, @Req() req: Request) {
    return this.withdrawalsService.create(user.id, dto, req.ip);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar saques',
    description: 'Histórico de saques do lojista. Paginado.',
  })
  @ApiResponse({ status: 200, description: 'Lista de saques' })
  findAll(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    return this.withdrawalsService.findAllByUser(user.id, p, l);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar saque',
    description: 'Retorna saque por ID',
  })
  @ApiResponse({ status: 200, description: 'Saque encontrado' })
  @ApiResponse({ status: 404, description: 'Saque não encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.withdrawalsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar saque',
    description:
      'Permite marcar como completed e informar tx_hash quando o saque for processado. ' +
      'Apenas saques em pending ou processing podem ter status alterado.',
  })
  @ApiResponse({ status: 200, description: 'Saque atualizado' })
  @ApiResponse({ status: 404, description: 'Saque não encontrado' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateWithdrawalDto,
    @Req() req: Request,
  ) {
    return this.withdrawalsService.update(id, user.id, dto, req.ip);
  }
}

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-apikey.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtOrApiKeyGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiOperation({
    summary: 'Métricas do dashboard',
    description: 'Volume transacionado, nº vendas, taxas, status (RF-017)',
  })
  @ApiResponse({ status: 200, description: 'Métricas agregadas' })
  getMetrics(@CurrentUser() user: User) {
    return this.dashboardService.getMetrics(user.id);
  }

  @Get('transactions')
  @ApiOperation({
    summary: 'Histórico de transações',
    description: 'Data, Valor BRL, Cripto, Taxa, Status, Hash, Explorer (RF-025). Paginado.',
  })
  @ApiResponse({ status: 200, description: 'Lista de transações confirmadas' })
  getTransactions(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    return this.dashboardService.getTransactions(user.id, p, l);
  }

  @Get('transactions/:id')
  @ApiOperation({
    summary: 'Buscar transação por ID',
    description: 'Retorna detalhes da transação incluindo hash e link do explorer',
  })
  @ApiResponse({ status: 200, description: 'Transação encontrada' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  getTransaction(@Param('id') id: string, @CurrentUser() user: User) {
    return this.dashboardService.getTransactionById(id, user.id);
  }
}

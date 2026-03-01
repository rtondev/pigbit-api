import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from '../../common/services/audit.service';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-apikey.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('audit-logs')
@ApiBearerAuth()
@Controller('audit-logs')
@UseGuards(JwtOrApiKeyGuard)
export class AuditLogsController {
  constructor(private auditService: AuditService) {}

  @Get()
  @ApiOperation({
    summary: 'Histórico de auditoria',
    description: 'Lista eventos críticos do usuário (RF-028). Paginado.',
  })
  @ApiResponse({ status: 200, description: 'Lista de logs' })
  async findMyLogs(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    return this.auditService.findByUser(user.id, p, l);
  }
}

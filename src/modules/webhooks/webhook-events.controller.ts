import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-apikey.guard';

@ApiTags('webhook-events')
@ApiBearerAuth()
@Controller('webhook-events')
@UseGuards(JwtOrApiKeyGuard)
export class WebhookEventsController {
  constructor(private webhooksService: WebhooksService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar eventos de webhook',
    description: 'Lista eventos de webhook para debug e auditoria. Paginado.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Página (default 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (default 20, max 100)' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    return this.webhooksService.findAll(p, l);
  }
}

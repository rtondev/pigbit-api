import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-apikey.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Post()
  @UseGuards(JwtOrApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Criar invoice',
    description: 'Gera cobrança via NOWPayments. Validade 15min.',
  })
  @ApiResponse({ status: 201, description: 'Invoice criado com payment_id e pay_address' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(@CurrentUser() user: User, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(user.id, dto);
  }

  @Get('currencies')
  @UseGuards(JwtOrApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Moedas disponíveis',
    description: 'Lista criptomoedas da NowPayments para criar faturas.',
  })
  @ApiResponse({ status: 200, description: 'Array de códigos de moedas (btc, eth, etc)' })
  getCurrencies() {
    return this.invoicesService.getCurrencies();
  }

  @Get()
  @UseGuards(JwtOrApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar invoices',
    description: 'Retorna cobranças do lojista. Paginado.',
  })
  @ApiResponse({ status: 200, description: 'Lista de invoices' })
  findAll(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    return this.invoicesService.findAllByUser(user.id, p, l);
  }

  @Get('checkout/:paymentId')
  @ApiOperation({
    summary: 'Checkout (público)',
    description: 'Dados para QR Code: endereço, valor cripto, status. Sem autenticação.',
  })
  @ApiResponse({ status: 200, description: 'Dados para pagamento' })
  @ApiResponse({ status: 404, description: 'Invoice não encontrado' })
  getCheckout(@Param('paymentId') paymentId: string) {
    return this.invoicesService.getCheckoutData(paymentId);
  }

  @Get(':id')
  @UseGuards(JwtOrApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Buscar invoice',
    description: 'Retorna invoice por ID com transaction associada.',
  })
  @ApiResponse({ status: 200, description: 'Invoice encontrado' })
  @ApiResponse({ status: 404, description: 'Invoice não encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.invoicesService.findById(id, user.id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtOrApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancelar invoice',
    description: 'Cancela invoice manualmente (apenas status waiting ou confirming)',
  })
  @ApiResponse({ status: 200, description: 'Invoice cancelado' })
  @ApiResponse({ status: 400, description: 'Invoice não pode ser cancelado' })
  @ApiResponse({ status: 404, description: 'Invoice não encontrado' })
  cancel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.invoicesService.cancel(id, user.id);
  }
}

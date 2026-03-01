import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CnpjLookupService } from './cnpj-lookup.service';
import { RegisterRequestDto } from './dto/register-request.dto';
import { RegisterConfirmDto } from './dto/register-confirm.dto';
import { LoginDto } from './dto/login.dto';
import {
  PasswordResetRequestDto,
  PasswordResetNewDto,
} from './dto/password-reset.dto';
import { TwoFaVerifyDto, TwoFaLoginDto } from './dto/two-fa.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private cnpjLookupService: CnpjLookupService,
  ) {}

  @Get('cnpj/:cnpj')
  @ApiOperation({ summary: 'Consultar CNPJ (BrasilAPI)', description: 'Público, sem autenticação' })
  async getCnpj(@Param('cnpj') cnpj: string) {
    return this.cnpjLookupService.lookup(cnpj);
  }

  @Post('register/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar registro',
    description: 'Envia código de verificação ao e-mail. Não cria conta até confirmar.',
  })
  @ApiResponse({ status: 200, description: 'Código enviado' })
  async registerRequest(@Body() dto: RegisterRequestDto, @Req() req: Request) {
    return this.authService.registerRequest(dto, req.ip);
  }

  @Post('register/confirm')
  @ApiOperation({
    summary: 'Confirmar registro',
    description: 'Valida código e cria conta. Retorna token JWT.',
  })
  @ApiResponse({ status: 201, description: 'Usuário criado. Retorna { user, token }' })
  async registerConfirm(@Body() dto: RegisterConfirmDto, @Req() req: Request) {
    return this.authService.registerConfirm(dto, req.ip);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login',
    description: 'Autenticação. Bloqueio 15min após 3 tentativas incorretas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Retorna { user, token }. Use token no header Authorization.',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas ou conta bloqueada',
  })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip, req.get('user-agent'));
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar reset de senha',
    description: 'Envia código ao e-mail informado',
  })
  @ApiResponse({ status: 200, description: 'Código enviado' })
  @ApiResponse({ status: 404, description: 'E-mail não encontrado' })
  async passwordResetRequest(@Body() dto: PasswordResetRequestDto, @Req() req: Request) {
    return this.authService.requestPasswordReset(dto.email, req.ip);
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmar nova senha',
    description: 'Valida código e define nova senha',
  })
  @ApiResponse({ status: 200, description: 'Senha alterada' })
  @ApiResponse({ status: 400, description: 'Código inválido ou expirado' })
  async passwordResetConfirm(@Body() dto: PasswordResetNewDto, @Req() req: Request) {
    return this.authService.resetPassword(dto.email, dto.codigo, dto.novaSenha, req.ip);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Ativar 2FA',
    description: 'Gera QR Code para Authenticator (RF-008)',
  })
  @ApiResponse({ status: 200, description: 'Retorna secret e QR Code base64' })
  async enable2fa(@CurrentUser() user: User, @Req() req: Request) {
    return this.authService.enable2fa(user.id, req.ip);
  }

  @Post('2fa/verify-enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar ativação 2FA' })
  @ApiResponse({ status: 200, description: '2FA ativado' })
  async verifyEnable2fa(
    @CurrentUser() user: User,
    @Body() dto: TwoFaVerifyDto,
    @Req() req: Request,
  ) {
    return this.authService.verifyAndEnable2fa(user.id, dto.codigo, req.ip);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desativar 2FA' })
  @ApiResponse({ status: 200, description: '2FA desativado' })
  async disable2fa(
    @CurrentUser() user: User,
    @Body() dto: TwoFaVerifyDto,
    @Req() req: Request,
  ) {
    return this.authService.disable2fa(user.id, dto.codigo, req.ip);
  }

  @Post('login/2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login com 2FA',
    description: 'Após login retornar 2FA_REQUIRED, enviar código aqui',
  })
  @ApiResponse({ status: 200, description: 'Retorna { user, token }' })
  @ApiResponse({ status: 401, description: 'Código inválido' })
  async login2fa(@Body() dto: TwoFaLoginDto, @Req() req: Request) {
    return this.authService.verify2fa(
      dto.email,
      dto.codigo,
      req.ip,
    );
  }
}

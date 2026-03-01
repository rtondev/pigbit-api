import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-apikey.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateEmailDto, UpdateCnpjDto } from './dto/update-sensitive.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtOrApiKeyGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Perfil do usuário',
    description: 'Retorna dados do lojista autenticado. Requer JWT.',
  })
  @ApiResponse({ status: 200, description: 'Dados do perfil' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  me(@CurrentUser() user: User) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Atualizar perfil',
    description: 'Altera telefone e nome fantasia (RF-015). Campos sensíveis exigem validação extra.',
  })
  @ApiResponse({ status: 200, description: 'Perfil atualizado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
    @Req() req: Request,
  ) {
    return this.usersService.update(user.id, dto, req.ip);
  }
}

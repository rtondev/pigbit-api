import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('api-keys')
@ApiBearerAuth()
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({
    summary: 'Gerar chave API',
    description:
      'Cria nova chave. A chave completa é retornada apenas uma vez. ' +
      'allowedIps: omitir = qualquer IP; informar lista = somente esses IPs.',
  })
  @ApiResponse({ status: 201, description: 'Chave criada (plainKey só aparece aqui)' })
  create(@CurrentUser() user: User, @Body() dto: CreateApiKeyDto) {
    return this.apiKeysService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar chaves API',
    description: 'Lista chaves do lojista (sem exibir a chave completa)',
  })
  @ApiResponse({ status: 200, description: 'Lista de chaves' })
  findAll(@CurrentUser() user: User) {
    return this.apiKeysService.findAllByUser(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revogar chave API' })
  @ApiResponse({ status: 204, description: 'Chave revogada' })
  @ApiResponse({ status: 404, description: 'Chave não encontrada' })
  delete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.apiKeysService.delete(id, user.id);
  }
}

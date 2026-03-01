import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('sw.js')
  @ApiExcludeEndpoint()
  @Header('Content-Type', 'application/javascript')
  swJs(): string {
    return '// Service worker placeholder';
  }

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Verifica se a API está online.',
  })
  @ApiResponse({ status: 200, description: 'API funcionando' })
  getHello(): string {
    return this.appService.getHello();
  }
}

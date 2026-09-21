import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { forwardErrorToHub } from '../common/hub-errors';
import { ReportErrorDto } from './dto/report-error.dto';

@Controller('errors')
@UseGuards(ThrottlerGuard)
export class ErrorsController {
  @Post('report')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async report(@Body() dto: ReportErrorDto) {
    await forwardErrorToHub({
      source: dto.source === 'backend' ? 'backend' : 'frontend',
      message: dto.message,
      stack: dto.stack,
      path: dto.path,
      method: dto.method,
      statusCode: dto.statusCode,
      metadata: dto.metadata,
    });
    return { received: true };
  }
}

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  private handleInternalError(exception: unknown): { message: string; status?: number } {
    if (exception instanceof Error) {
      const msg = exception.message;
      if (msg?.includes('duplicate key') || msg?.includes('unique constraint'))
        return { message: 'Email ou CNPJ já cadastrado', status: HttpStatus.CONFLICT };
      if (msg?.includes('connect') || msg?.includes('ECONNREFUSED'))
        return { message: 'Serviço temporariamente indisponível. Tente novamente.' };
      return { message: msg || 'Erro interno do servidor. Tente novamente.' };
    }
    return { message: 'Erro interno do servidor. Tente novamente.' };
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    } else {
      const internal = this.handleInternalError(exception);
      status = internal.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      message = { message: internal.message };
    }

    const body =
      typeof message === 'object' && message !== null
        ? message
        : { message };

    this.logger.error(
      `${request.method} ${request.url} - ${status}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(typeof body === 'object' ? body : {}),
    });
  }
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.use(
    express.json({
      verify: (req: express.Request & { rawBody?: Buffer }, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swagger = new DocumentBuilder()
    .setTitle('PIGBIT API')
    .setDescription(
      'Plataforma SaaS de Pagamentos em Criptomoedas. Gateway NOWPayments. ' +
        'Autenticação via JWT Bearer. Endpoints protegidos exigem header Authorization.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
}

bootstrap();

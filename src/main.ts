import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './modules/common/filters/global-exception.filters';
import { ValidationPipe } from '@nestjs/common';
import { createRequestValidationException } from './modules/common/validation/validation-error.factory';
import * as bodyParser from 'body-parser';
import { SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import {
  buildSwaggerDocumentConfig,
  GLOBAL_API_PREFIX,
} from './swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Convierte el cuerpo a la clase del DTO
      whitelist: true, // Elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // Lanza error si se reciben propiedades no permitidas
      exceptionFactory: createRequestValidationException,
      /*
      transformOptions: {
        enableImplicitConversion: true,
      },*/
    }),
  );

  const config = buildSwaggerDocumentConfig();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(GLOBAL_API_PREFIX, app, documentFactory);

  // Configurar prefijo para endpoints
  app.setGlobalPrefix(GLOBAL_API_PREFIX);

  // Configurar filtro global de excepciones
  app.useGlobalFilters(new GlobalExceptionFilter());
  // inspeccion de rutas

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  // inspeccion de rutas
  const router = app.getHttpAdapter().getInstance();
  console.log(router._router?.stack);
}
bootstrap();

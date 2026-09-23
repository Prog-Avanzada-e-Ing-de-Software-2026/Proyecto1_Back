import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppModule } from '../app.module';
import {
  buildSwaggerDocumentConfig,
  GLOBAL_API_PREFIX,
} from '../swagger.config';

async function generateOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();

  app.setGlobalPrefix(GLOBAL_API_PREFIX);

  const config = buildSwaggerDocumentConfig();

  const document = SwaggerModule.createDocument(app, config);

  const outputPath = resolve(process.cwd(), 'openapi.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf-8');

  await app.close();
  console.log(`OpenAPI document generated at ${outputPath}`);
}

generateOpenApi().catch((error) => {
  console.error('Error generating OpenAPI document:', error);
  process.exit(1);
});

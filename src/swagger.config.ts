import { DocumentBuilder } from '@nestjs/swagger';

/**
 * Single source of truth for the HTTP prefix and the Swagger document config.
 * Both the runtime bootstrap (`src/main.ts`) and the OpenAPI generator
 * (`src/scripts/generate-openapi.ts`) must use these values so the generated
 * document always matches the served routes.
 */
export const GLOBAL_API_PREFIX = 'api';

export function buildSwaggerDocumentConfig() {
  return new DocumentBuilder()
    .setTitle('Gestión Base - Distribuidora')
    .setDescription('La descripción de las  API  de la distribuidora')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT de acceso. Formato: Bearer <token>',
      },
      'bearer',
    )
    .build();
}

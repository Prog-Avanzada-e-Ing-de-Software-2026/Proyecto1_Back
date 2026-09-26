import { Type, applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  getSchemaPath,
} from '@nestjs/swagger';

export class ListadoConTotalDto<T> {
  @ApiProperty({ description: 'Listado de resultados', isArray: true })
  data: T[];

  @ApiProperty({ description: 'Cantidad total de elementos' })
  total: number;
}

export function ApiListadoConTotal<T>(
  model: Type<T>,
  description: string,
): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ListadoConTotalDto, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ListadoConTotalDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
}

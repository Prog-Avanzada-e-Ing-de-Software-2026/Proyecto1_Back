import { IsBoolean, IsInt, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  toQueryNumber,
  toStrictBoolean,
} from '../../common/validation/request-transforms';

export class SearchProductoRapidoDto {
  @ApiProperty({
    type: String,
    description: 'Código de barras o de proveedor a buscar.',
    example: '7791234567890',
  })
  @IsString()
  codigo: string;

  @ApiProperty({
    type: Boolean,
    default: false,
    description: 'Indica si la búsqueda debe coincidir exactamente.',
    example: false,
  })
  @Transform(({ value }) => toStrictBoolean(value))
  @IsBoolean({ message: 'exacto debe ser un valor booleano.' })
  exacto: boolean = false;

  @ApiProperty({
    type: Number,
    minimum: 0,
    default: 0,
    description: 'Cantidad de elementos a omitir.',
    example: 0,
  })
  @IsInt({ message: 'skip debe ser un número entero.' })
  @Min(0, { message: 'skip debe ser un número entero positivo o 0' })
  @Transform(({ value }) => toQueryNumber(value))
  skip: number = 0;

  @ApiProperty({
    type: Number,
    minimum: 1,
    default: 10,
    description: 'Cantidad de elementos a retornar.',
    example: 10,
  })
  @IsInt({ message: 'take debe ser un número entero.' })
  @Min(1, { message: 'take debe ser un número entero mayor que 0' })
  @Transform(({ value }) => toQueryNumber(value))
  take: number = 10;
}

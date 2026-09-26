import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Min } from 'class-validator';
import {
  IsOptionalWhenUndefined,
  toQueryDate,
  toQueryNumber,
} from '../../common/validation/request-transforms';

export class SearchInformacionProductoDto {
  @ApiProperty({
    type: Number,
    description: 'ID del producto a consultar.',
    example: 123,
  })
  @Type(() => Number)
  @IsInt({ message: 'productoId debe ser un número entero.' })
  productoId: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Fecha inicial del filtro.',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsDate({ message: 'fechaDesde debe ser una fecha válida.' })
  @Type(() => Date)
  fechaDesde: Date;

  @ApiProperty({
    description: 'Fecha final del filtro (incluida)',
    example: '2024-12-31',
    type: String,
    format: 'date',
  })
  @IsDate({ message: 'fechaHasta debe ser una fecha válida.' })
  @Transform(({ value }) => {
    const transformed = toQueryDate(value);
    if (transformed instanceof Date) {
      transformed.setUTCHours(23, 59, 59, 999);
    }
    return transformed;
  })
  fechaHasta: Date;

  @ApiProperty({
    type: Number,
    minimum: 0,
    default: 0,
    description: 'Cantidad de elementos a omitir.',
    example: 0,
  })
  @IsInt({ message: 'skip debe ser un número entero.' })
  @Min(0, { message: 'skip debe ser un número entero positivo o 0' })
  @Type(() => Number)
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
  @Type(() => Number)
  take: number = 10;
}

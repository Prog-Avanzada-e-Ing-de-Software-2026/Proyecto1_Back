import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Min } from 'class-validator';
import {
  IsOptionalWhenUndefined,
  toQueryDate,
  toQueryNumber,
} from '../../common/validation/request-validation.helpers';

export class SearchInformacionProductoDto {
  @Type(() => Number)
  @IsInt({ message: 'productoId debe ser un número entero.' })
  productoId: number;

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

  @IsInt({ message: 'skip debe ser un número entero.' })
  @Min(0, { message: 'skip debe ser un número entero positivo o 0' })
  @Type(() => Number)
  skip: number = 0;

  @IsInt({ message: 'take debe ser un número entero.' })
  @Min(1, { message: 'take debe ser un número entero mayor que 0' })
  @Type(() => Number)
  take: number = 10;
}

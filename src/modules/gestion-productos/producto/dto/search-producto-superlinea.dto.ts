import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { toQueryNumber } from '../../common/validation/request-validation.helpers';

export class SearchProductoSuperlineaDto {
  @ApiProperty({ example: 5, description: 'ID de la superlínea' })
  @Transform(({ value }) => toQueryNumber(value))
  @IsInt({ message: 'El superLineaId debe ser un número entero.' })
  @Min(1, { message: 'El superLineaId debe ser un número entero positivo.' })
  superLineaId: number;

  @ApiProperty({ example: 0, description: 'Cantidad de elementos a omitir' })
  @IsInt({ message: 'skip debe ser un número entero.' })
  @Min(0, { message: 'skip debe ser un número entero positivo o 0' })
  @Transform(({ value }) => toQueryNumber(value))
  skip: number = 0;

  @ApiProperty({ example: 10, description: 'Cantidad de elementos a retornar' })
  @IsInt({ message: 'take debe ser un número entero.' })
  @Min(1, { message: 'take debe ser un número entero mayor que 0' })
  @Transform(({ value }) => toQueryNumber(value))
  take: number = 10;
}

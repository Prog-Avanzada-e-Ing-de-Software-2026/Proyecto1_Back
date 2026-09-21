import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class SearchProductoSuperlineaDto {
  @ApiProperty({ example: 5, description: 'ID de la superlínea' })
  @Type(() => Number)
  @IsInt()
  superLineaId: number;

  @ApiProperty({ example: 0, description: 'Cantidad de elementos a omitir' })
  @IsInt()
  @Min(0, { message: 'skip debe ser un número entero positivo o 0' })
  @Type(() => Number)
  skip: number = 0;

  @ApiProperty({ example: 10, description: 'Cantidad de elementos a retornar' })
  @IsInt()
  @Min(1, { message: 'take debe ser un número entero mayor que 0' })
  @Type(() => Number)
  take: number = 10;
}

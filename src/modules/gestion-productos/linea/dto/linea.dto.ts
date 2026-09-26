import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ReferenciaDto } from 'src/modules/common/dto/referencia.dto';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class LineaDto {
  @ApiProperty({ type: Number, example: 123, description: 'ID del la linea' })
  @Type(() => Number)
  @IsInt()
  id: number;

  @ApiProperty({
    type: String,
    example: 'tornillos',
    description: 'Denominación o nombre dela linea',
  })
  @IsString()
  denominacion: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Stock mínimo de la línea.',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  stockMinimo?: number;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Indica si la línea utiliza stock mínimo.',
  })
  @IsBoolean()
  @IsNotEmpty()
  utilizaStockMinimo: boolean;

  @ApiProperty({
    type: String,
    example: '',
    description: 'Observaciones varias sobre la linea',
  })
  @IsString()
  observacion: string;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'de sistema no se puede editar ni eliminar',
  })
  @Type(() => Number)
  @IsInt()
  sistema: number;

  @ApiProperty({ type: String, example: null, description: 'Fecha de eliminación (null si está activa)', nullable: true })
  @IsOptional()
  deletedAt: string | null;

  @ApiProperty({
    type: () => ReferenciaDto,
    description: 'Superlínea a la que pertenece la línea.',
  })
  superLinea: ReferenciaDto;

}

import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  Matches,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptionalWhenUndefined,
  IsPositiveInteger,
  IsQuantity,
  normalizeString,
  toStrictBoolean,
} from '../../common/validation/request-validation.helpers';

export class UpdateLineaDto {
  @IsOptionalWhenUndefined()
  @Transform(({ value }) => normalizeString(value))
  @IsString({ message: 'La denominación debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La denominación no puede estar vacía.' })
  @MaxLength(255, {
    message: 'La denominación no puede superar los 255 caracteres.',
  })
  @Matches(/^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ]+$/, {
    message: 'La denominación solo puede contener letras, números y espacios.',
  })
  denominacion?: string;

  @IsOptionalWhenUndefined()
  @IsNumber({}, { message: 'El stock mínimo debe ser un número.' })
  @IsQuantity({ message: 'El stock mínimo debe respetar el formato decimal válido.' })
  stockMinimo?: number;

  @IsOptionalWhenUndefined()
  @Transform(({ value }) => toStrictBoolean(value))
  @IsBoolean({ message: 'utilizaStockMinimo debe ser un valor booleano.' })
  utilizaStockMinimo?: boolean;

  @IsOptionalWhenUndefined()
  @IsString()
  observacion?: string;

  @IsOptional()
  createdAt?: Date;

  @IsNotEmpty({ message: 'El usuarioUpdatedId es obligatorio.' })
  @IsPositiveInteger({
    message: 'El usuarioUpdatedId debe ser un número entero positivo.',
  })
  usuarioUpdatedId: number;

  @ApiProperty({ example: 1, description: 'ID de la SuperLínea asociada' })
  @IsOptionalWhenUndefined()
  @IsPositiveInteger({
    message: 'El superLineaId debe ser un número entero positivo.',
  })
  superLineaId?: number;

  @ApiProperty({
    example: null,
    description: 'Fecha de eliminación (null si está activa)',
    nullable: true,
  })
  @IsOptional()
  deletedAt?: string | null;
}

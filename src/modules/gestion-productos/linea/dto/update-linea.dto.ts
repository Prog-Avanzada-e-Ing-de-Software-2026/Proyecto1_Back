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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptionalWhenUndefined,
  IsPositiveInteger,
  IsQuantity,
  normalizeString,
  toStrictBoolean,
} from '../../common/validation/request-transforms';

export class UpdateLineaDto {
  @ApiPropertyOptional({
    type: String,
    maxLength: 255,
    pattern: /^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ]+$/.source,
    description:
      'Nueva denominación o nombre de la línea. No puede superar los 255 caracteres.',
    example: 'tornillos',
  })
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

  @ApiPropertyOptional({
    type: Number,
    description: 'Stock mínimo de la línea. Admite hasta 3 decimales.',
    example: 5,
  })
  @IsOptionalWhenUndefined()
  @IsNumber({}, { message: 'El stock mínimo debe ser un número.' })
  @IsQuantity({ message: 'El stock mínimo debe respetar el formato decimal válido con hasta 3 decimales.' })
  stockMinimo?: number;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Indica si la línea utiliza stock mínimo.',
    example: false,
  })
  @IsOptionalWhenUndefined()
  @Transform(({ value }) => toStrictBoolean(value))
  @IsBoolean({ message: 'utilizaStockMinimo debe ser un valor booleano.' })
  utilizaStockMinimo?: boolean;

  @ApiPropertyOptional({
    type: String,
    description: 'Observaciones varias sobre la línea.',
    example: '',
  })
  @IsOptionalWhenUndefined()
  @IsString()
  observacion?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    readOnly: true,
    description: 'Fecha y hora de creación (generada por el servidor).',
    example: '2026-09-23T15:00:00.000Z',
  })
  @IsOptional()
  createdAt?: Date;

  @ApiProperty({
    type: Number,
    minimum: 1,
    description:
      'ID del usuario que actualiza la línea. Debe ser un número entero positivo.',
    example: 1,
  })
  @IsNotEmpty({ message: 'El usuarioUpdatedId es obligatorio.' })
  @IsPositiveInteger({
    message: 'El usuarioUpdatedId debe ser un número entero positivo.',
  })
  usuarioUpdatedId: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    description:
      'ID de la SuperLínea asociada. Debe ser un entero positivo.',
    example: 1,
  })
  @IsOptionalWhenUndefined()
  @IsPositiveInteger({
    message: 'El superLineaId debe ser un número entero positivo.',
  })
  superLineaId?: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    readOnly: true,
    nullable: true,
    description: 'Fecha de eliminación (null si está activa).',
    example: null,
  })
  @IsOptional()
  deletedAt?: string | null;
}

import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptionalWhenUndefined,
  IsPositiveInteger,
  normalizeString,
} from '../../common/validation/request-transforms';

export class UpdateMarcaDto {
  @ApiPropertyOptional({
    type: String,
    maxLength: 255,
    pattern: /^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ]+$/.source,
    description:
      'Nueva denominación o nombre de la marca. No puede superar los 255 caracteres.',
    example: 'IVECO',
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
    type: String,
    description: 'Observaciones varias sobre la marca.',
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
      'ID del usuario que actualiza la marca. Debe ser un número entero positivo.',
    example: 1,
  })
  @IsNotEmpty({ message: 'El usuarioUpdatedId es obligatorio.' })
  @IsPositiveInteger({
    message: 'El usuarioUpdatedId debe ser un número entero positivo.',
  })
  usuarioUpdatedId: number;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    readOnly: true,
    description: 'Fecha y hora de la última actualización (generada por el servidor).',
    example: '2026-09-23T15:00:00.000Z',
  })
  updatedAt?: Date;
}

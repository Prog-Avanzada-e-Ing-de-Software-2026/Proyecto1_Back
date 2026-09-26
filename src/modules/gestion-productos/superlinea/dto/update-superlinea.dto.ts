import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptionalWhenUndefined,
  IsPositiveInteger,
  normalizeString,
} from '../../common/validation/request-transforms';

export class UpdateSuperLineaDto {
  @ApiPropertyOptional({
    type: String,
    maxLength: 255,
    pattern: /^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ]+$/.source,
    description:
      'Nueva denominación o nombre de la superlínea. No puede superar los 255 caracteres.',
    example: 'Herramientas',
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
    description: 'Observaciones varias sobre la superlínea.',
    example: 'Uso industrial',
  })
  @IsOptionalWhenUndefined()
  @IsString()
  observacion?: string;

  @ApiProperty({
    type: Number,
    minimum: 1,
    description:
      'ID del usuario que actualiza la superlínea. Debe ser un número entero positivo.',
    example: 1,
  })
  @IsNotEmpty({ message: 'El usuarioUpdatedId es obligatorio.' })
  @IsPositiveInteger({
    message: 'El usuarioUpdatedId debe ser un número entero positivo.',
  })
  usuarioUpdatedId: number;
}

import {
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptionalWhenUndefined,
  IsPositiveInteger,
} from '../../common/validation/request-transforms';

export class UpdateProductoOperacionDto {
  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    description: 'ID del producto. Debe ser un número entero positivo.',
    example: 1,
  })
  @IsOptionalWhenUndefined()
  @IsPositiveInteger({
    message: 'El productoId debe ser un número entero positivo.',
  })
  productoId?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    description: 'ID de la operación. Debe ser un número entero positivo.',
    example: 1,
  })
  @IsOptionalWhenUndefined()
  @IsPositiveInteger({
    message: 'El operacionId debe ser un número entero positivo.',
  })
  operacionId?: number;

  @ApiPropertyOptional({
    type: String,
    minLength: 1,
    maxLength: 255,
    description:
      'Tipo de operación. No puede estar vacío ni superar los 255 caracteres.',
    example: 'VENTA',
  })
  @IsOptionalWhenUndefined()
  @IsString({ message: 'El tipo de operación debe ser una cadena de texto.' })
  @MinLength(1, { message: 'El tipo de operación no puede estar vacío.' })
  @MaxLength(255, {
    message: 'El tipo de operación no puede superar los 255 caracteres.',
  })
  tipoOperacion?: string;
}

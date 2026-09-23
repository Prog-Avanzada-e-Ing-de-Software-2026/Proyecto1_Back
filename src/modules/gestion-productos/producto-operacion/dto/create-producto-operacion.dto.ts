import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsPositiveInteger } from '../../common/validation/request-transforms';

export class CreateProductoOperacionDto {
  @ApiProperty({
    type: Number,
    minimum: 1,
    description: 'ID del producto. Debe ser un número entero positivo.',
    example: 1,
  })
  @IsNotEmpty({ message: 'El productoId es obligatorio.' })
  @IsPositiveInteger({
    message: 'El productoId debe ser un número entero positivo.',
  })
  productoId: number;

  @ApiProperty({
    type: Number,
    minimum: 1,
    description: 'ID de la operación. Debe ser un número entero positivo.',
    example: 1,
  })
  @IsNotEmpty({ message: 'El operacionId es obligatorio.' })
  @IsPositiveInteger({
    message: 'El operacionId debe ser un número entero positivo.',
  })
  operacionId: number;

  @ApiProperty({
    type: String,
    minLength: 1,
    maxLength: 255,
    description:
      'Tipo de operación. No puede estar vacío ni superar los 255 caracteres.',
    example: 'VENTA',
  })
  @IsNotEmpty({ message: 'El tipo de operación es obligatorio.' })
  @IsString({ message: 'El tipo de operación debe ser una cadena de texto.' })
  @MinLength(1, { message: 'El tipo de operación no puede estar vacío.' })
  @MaxLength(255, {
    message: 'El tipo de operación no puede superar los 255 caracteres.',
  })
  tipoOperacion: string;
}

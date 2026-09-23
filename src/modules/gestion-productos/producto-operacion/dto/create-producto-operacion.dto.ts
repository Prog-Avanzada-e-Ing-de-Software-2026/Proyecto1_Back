import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { IsPositiveInteger } from '../../common/validation/request-transforms';

export class CreateProductoOperacionDto {
  @IsNotEmpty({ message: 'El productoId es obligatorio.' })
  @IsPositiveInteger({
    message: 'El productoId debe ser un número entero positivo.',
  })
  productoId: number;

  @IsNotEmpty({ message: 'El operacionId es obligatorio.' })
  @IsPositiveInteger({
    message: 'El operacionId debe ser un número entero positivo.',
  })
  operacionId: number;

  @IsNotEmpty({ message: 'El tipo de operación es obligatorio.' })
  @IsString({ message: 'El tipo de operación debe ser una cadena de texto.' })
  @MinLength(1, { message: 'El tipo de operación no puede estar vacío.' })
  @MaxLength(255, {
    message: 'El tipo de operación no puede superar los 255 caracteres.',
  })
  tipoOperacion: string;
}

import {
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  IsOptionalWhenUndefined,
  IsPositiveInteger,
} from '../../common/validation/request-transforms';

export class UpdateProductoOperacionDto {
  @IsOptionalWhenUndefined()
  @IsPositiveInteger({
    message: 'El productoId debe ser un número entero positivo.',
  })
  productoId?: number;

  @IsOptionalWhenUndefined()
  @IsPositiveInteger({
    message: 'El operacionId debe ser un número entero positivo.',
  })
  operacionId?: number;

  @IsOptionalWhenUndefined()
  @IsString({ message: 'El tipo de operación debe ser una cadena de texto.' })
  @MinLength(1, { message: 'El tipo de operación no puede estar vacío.' })
  @MaxLength(255, {
    message: 'El tipo de operación no puede superar los 255 caracteres.',
  })
  tipoOperacion?: string;
}

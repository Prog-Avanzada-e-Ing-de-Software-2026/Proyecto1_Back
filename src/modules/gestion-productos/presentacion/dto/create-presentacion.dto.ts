import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  Matches,
} from 'class-validator';
import {
  IsOptionalWhenUndefined,
  IsPositiveInteger,
  normalizeString,
} from '../../common/validation/request-validation.helpers';

export class CreatePresentacionDto {
  @Transform(({ value }) => normalizeString(value))
  @IsString({ message: 'La denominación debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La denominación no puede estar vacía.' })
  @MaxLength(255, {
    message: 'La denominación no puede superar los 255 caracteres.',
  })
  @Matches(/^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ.\-/]+$/, {
    message:
      'La denominación solo puede contener letras, números, espacios, puntos, guiones y barras.',
  })
  denominacion: string;

  @IsOptionalWhenUndefined()
  @IsString()
  observacion?: string;

  @IsNotEmpty({ message: 'El usuarioCreatedId es obligatorio.' })
  @IsPositiveInteger({
    message: 'El usuarioCreatedId debe ser un número entero positivo.',
  })
  usuarioCreatedId: number;
}

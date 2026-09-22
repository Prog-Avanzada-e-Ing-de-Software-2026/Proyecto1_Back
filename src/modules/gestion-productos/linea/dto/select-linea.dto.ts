import { IsString } from 'class-validator';
import { IsOptionalWhenUndefined } from '../../common/validation/request-validation.helpers';

export class SelectLineaDto {
  @IsOptionalWhenUndefined()
  @IsString({ message: 'La denominación debe ser una cadena de texto.' })
  denominacion?: string;
}

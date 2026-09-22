import { IsString } from 'class-validator';
import { IsOptionalWhenUndefined } from '../../common/validation/request-validation.helpers';

export class SelectPresentacionDto {
  @IsOptionalWhenUndefined()
  @IsString({ message: 'La denominación debe ser una cadena de texto.' })
  denominacion?: string;
}

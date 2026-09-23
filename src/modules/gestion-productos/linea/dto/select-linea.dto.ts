import { IsString } from 'class-validator';
import { IsOptionalWhenUndefined } from '../../common/validation/request-transforms';

export class SelectLineaDto {
  @IsOptionalWhenUndefined()
  @IsString({ message: 'La denominación debe ser una cadena de texto.' })
  denominacion?: string;
}

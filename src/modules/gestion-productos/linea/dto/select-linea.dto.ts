import { IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptionalWhenUndefined } from '../../common/validation/request-transforms';

export class SelectLineaDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Denominación a filtrar.',
    example: 'tornillo',
  })
  @IsOptionalWhenUndefined()
  @IsString({ message: 'La denominación debe ser una cadena de texto.' })
  denominacion?: string;
}

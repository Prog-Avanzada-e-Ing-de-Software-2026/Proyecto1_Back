import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DenominacionBusquedaDto {

  @IsString()
  @ApiPropertyOptional({
    description: 'Denominación a filtrar.',
    example: 'tornillo',
  })
  denominacion?: string;


}

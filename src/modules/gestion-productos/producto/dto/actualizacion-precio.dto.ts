import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { TipoAumento } from 'src/modules/common/enums/tipo-aumento.emun';
import { OperacionAjuste } from 'src/modules/common/enums/operacion-ajuste.enum';
import {
  IsMoney,
  IsPositiveInteger,
  IsOptionalWhenUndefined,
  toQueryNumber,
} from '../../common/validation/request-validation.helpers';

export class ActualizacionPrecioDto {
  @ApiPropertyOptional({
    example: 12,
    description: 'ID de la línea a la que pertenece el conjunto de productos.',
  })
  @IsOptionalWhenUndefined()
  @IsPositiveInteger({ message: 'La línea debe ser un número entero positivo.' })
  lineaId?: number;

  @ApiProperty({
    enum: TipoAumento,
    example: TipoAumento.PORCENTAJE,
    description: 'Tipo de ajuste: monto fijo o porcentaje.',
  })
  @IsEnum(TipoAumento, {
    message: 'El tipo de ajuste debe ser PORCENTAJE o MONTO_FIJO.',
  })
  tipoAjuste: TipoAumento;

  @ApiProperty({
    enum: OperacionAjuste,
    example: OperacionAjuste.AUMENTO,
    description: 'Sentido del ajuste: aumento o disminución.',
  })
  @IsEnum(OperacionAjuste, {
    message: 'La operación debe ser AUMENTO o DISMINUCION.',
  })
  operacion: OperacionAjuste;

  @ApiProperty({
    example: 10,
    description: 'Valor del ajuste. Debe ser mayor que 0.',
  })
  @Transform(({ value }) => toQueryNumber(value))
  @IsNumber({}, { message: 'El valor del ajuste debe ser un número.' })
  @IsPositive({ message: 'El valor del ajuste debe ser mayor que 0.' })
  @IsMoney({ message: 'El valor del ajuste debe respetar el formato monetario válido.' })
  valor: number;
}

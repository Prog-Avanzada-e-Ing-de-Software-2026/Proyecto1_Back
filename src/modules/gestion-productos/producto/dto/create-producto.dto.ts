import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  Matches,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  ValidateIf,
  IsPositive,
} from 'class-validator';
import { AlicuotaIva } from 'src/modules/organizacion/enums/alicuota-iva.enum';
import {
  IsMoney,
  IsPercentage,
  IsPositiveInteger,
  IsQuantity,
  IsOptionalWhenUndefined,
  normalizeString,
  toStrictBoolean,
} from '../../common/validation/request-validation.helpers';

export class CreateProductoDto {
  @Transform(({ value }) => normalizeString(value))
  @IsString({ message: 'La denominación debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La denominación no puede estar vacía.' })
  @MaxLength(200, {
    message: 'La denominación no puede superar los 200 caracteres.',
  })
  @Matches(/^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ.\-/%]+$/, {
    message: 'La denominación contiene caracteres inválidos.',
  })
  denominacion: string;

  @IsOptionalWhenUndefined()
  @IsString()
  observacion?: string;

  @IsOptionalWhenUndefined()
  @IsString()
  codigoProveedor?: string;

  @IsOptionalWhenUndefined()
  @IsString()
  codigoBarra?: string;

  @IsOptionalWhenUndefined()
  @IsString()
  codigoReferencia?: string;

  @IsOptionalWhenUndefined()
  @IsString()
  ubicacion?: string;

  @Transform(({ value }) => toStrictBoolean(value))
  @IsBoolean({ message: 'utilizaStockMinimo debe ser un valor booleano.' })
  utilizaStockMinimo: boolean;

  @Transform(({ value }) => toStrictBoolean(value))
  @IsBoolean({ message: 'utilizaPack debe ser un valor booleano.' })
  utilizaPack: boolean;

  @ValidateIf((o: CreateProductoDto) => o.utilizaPack === true)
  @IsPositiveInteger({
    message: 'La cantidad por pack debe ser un número entero positivo.',
  })
  cantidadPorPack?: number;

  @Transform(({ value }) => toStrictBoolean(value))
  @IsOptionalWhenUndefined()
  @IsBoolean({ message: 'costoEnDolar debe ser un valor booleano.' })
  costoEnDolar?: boolean;

  @Transform(({ value }) => toStrictBoolean(value))
  @IsOptionalWhenUndefined()
  @IsBoolean({ message: 'destacado debe ser un valor booleano.' })
  destacado?: boolean;

  @Transform(({ value }) => toStrictBoolean(value))
  @IsOptionalWhenUndefined()
  @IsBoolean({ message: 'envioGratis debe ser un valor booleano.' })
  envioGratis?: boolean;

  @IsNotEmpty({ message: 'El costo es obligatorio.' })
  @IsNumber({}, { message: 'El costo debe ser un número.' })
  @IsMoney({ message: 'El costo debe ser un valor monetario válido.' })
  costo: number;

  @IsNotEmpty({ message: 'El porcentaje es obligatorio.' })
  @IsNumber({}, { message: 'El porcentaje debe ser un número.' })
  @IsPositive({ message: 'El porcentaje debe ser mayor que 0.' })
  @IsPercentage({ message: 'El porcentaje debe respetar el formato decimal válido.' })
  porcentaje: number;

  @IsNotEmpty({ message: 'El stock es obligatorio.' })
  @IsNumber({}, { message: 'El stock debe ser un número.' })
  @IsPositive({ message: 'El stock debe ser mayor que 0.' })
  @IsQuantity({ message: 'El stock debe respetar el formato decimal válido.' })
  stock: number;

  @IsNotEmpty({ message: 'El stock mínimo es obligatorio.' })
  @IsNumber({}, { message: 'El stock mínimo debe ser un número.' })
  @IsPositive({ message: 'El stock mínimo debe ser mayor que 0.' })
  @IsQuantity({ message: 'El stock mínimo debe respetar el formato decimal válido.' })
  stockMinimo: number;

  @IsNotEmpty({ message: 'La línea es obligatoria.' })
  @IsPositiveInteger({ message: 'La línea debe ser un número entero positivo.' })
  lineaId: number;

  @IsNotEmpty({ message: 'La marca es obligatoria.' })
  @IsPositiveInteger({ message: 'La marca debe ser un número entero positivo.' })
  marcaId: number;

  @IsNotEmpty({ message: 'La presentación es obligatoria.' })
  @IsPositiveInteger({
    message: 'La presentación debe ser un número entero positivo.',
  })
  presentacionId: number;

  @IsOptionalWhenUndefined()
  @IsNumber({}, { message: 'El costo en dólares debe ser un número.' })
  costoDolar?: number;

  @IsNotEmpty({ message: 'El precio es obligatorio.' })
  @IsNumber({}, { message: 'El precio debe ser un número.' })
  precio: number;

  @IsEnum(AlicuotaIva, {
    message:
      'tipo debe ser ALICUOTA_0, ALICUOTA_105, ALICUOTA_21 o ALICUOTA_27.',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return AlicuotaIva[value.toUpperCase() as keyof typeof AlicuotaIva];
    }
    return value;
  })
  alicuotaIva: AlicuotaIva;

  @IsNotEmpty({ message: 'El usuarioCreatedId es obligatorio.' })
  @IsPositiveInteger({
    message: 'El usuarioCreatedId debe ser un número entero positivo.',
  })
  usuarioCreatedId: number;
}

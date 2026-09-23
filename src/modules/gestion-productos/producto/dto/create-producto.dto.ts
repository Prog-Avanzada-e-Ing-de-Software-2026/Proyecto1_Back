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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlicuotaIva } from 'src/modules/organizacion/enums/alicuota-iva.enum';
import {
  IsMoney,
  IsPercentage,
  IsPositiveInteger,
  IsQuantity,
  IsOptionalWhenUndefined,
  normalizeString,
  toStrictBoolean,
} from '../../common/validation/request-transforms';

export class CreateProductoDto {
  @ApiProperty({
    type: String,
    maxLength: 200,
    pattern: /^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ.\-/%]+$/.source,
    description:
      'Denominación o nombre del producto. No puede superar los 200 caracteres.',
    example: '1158 Caja de tornillos',
  })
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

  @ApiPropertyOptional({
    type: String,
    description: 'Observaciones del producto.',
    example: '',
  })
  @IsOptionalWhenUndefined()
  @IsString()
  observacion?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Código del proveedor del producto.',
    example: 'ABC-1234',
  })
  @IsOptionalWhenUndefined()
  @IsString()
  codigoProveedor?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Código de barras del producto.',
    example: '7791234567890',
  })
  @IsOptionalWhenUndefined()
  @IsString()
  codigoBarra?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Código de referencia del producto.',
    example: 'REF-001',
  })
  @IsOptionalWhenUndefined()
  @IsString()
  codigoReferencia?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Ubicación física del producto.',
    example: 'Estante A1',
  })
  @IsOptionalWhenUndefined()
  @IsString()
  ubicacion?: string;

  @ApiProperty({
    type: Boolean,
    description: 'Indica si el producto utiliza stock mínimo.',
    example: false,
  })
  @Transform(({ value }) => toStrictBoolean(value))
  @IsBoolean({ message: 'utilizaStockMinimo debe ser un valor booleano.' })
  utilizaStockMinimo: boolean;

  @ApiProperty({
    type: Boolean,
    description: 'Indica si el producto se comercializa por pack.',
    example: false,
  })
  @Transform(({ value }) => toStrictBoolean(value))
  @IsBoolean({ message: 'utilizaPack debe ser un valor booleano.' })
  utilizaPack: boolean;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    description:
      'Cantidad de unidades por pack. Requerido cuando utilizaPack es true.',
    example: 6,
  })
  @ValidateIf((o: CreateProductoDto) => o.utilizaPack === true)
  @IsPositiveInteger({
    message: 'La cantidad por pack debe ser un número entero positivo.',
  })
  cantidadPorPack?: number;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Indica si el costo está expresado en dólares.',
    example: false,
  })
  @Transform(({ value }) => toStrictBoolean(value))
  @IsOptionalWhenUndefined()
  @IsBoolean({ message: 'costoEnDolar debe ser un valor booleano.' })
  costoEnDolar?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Indica si el producto está destacado.',
    example: false,
  })
  @Transform(({ value }) => toStrictBoolean(value))
  @IsOptionalWhenUndefined()
  @IsBoolean({ message: 'destacado debe ser un valor booleano.' })
  destacado?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Indica si el producto tiene envío gratis.',
    example: false,
  })
  @Transform(({ value }) => toStrictBoolean(value))
  @IsOptionalWhenUndefined()
  @IsBoolean({ message: 'envioGratis debe ser un valor booleano.' })
  envioGratis?: boolean;

  @ApiProperty({
    type: Number,
    description: 'Costo del producto. Valor monetario con hasta 5 decimales.',
    example: 100.5,
  })
  @IsNotEmpty({ message: 'El costo es obligatorio.' })
  @IsNumber({}, { message: 'El costo debe ser un número.' })
  @IsMoney({ message: 'El costo debe ser un valor monetario válido con hasta 5 decimales.' })
  costo: number;

  @ApiProperty({
    type: Number,
    minimum: 0,
    exclusiveMinimum: true,
    description:
      'Porcentaje de ganancia. Debe ser mayor que 0 y admite hasta 2 decimales.',
    example: 30.5,
  })
  @IsNotEmpty({ message: 'El porcentaje es obligatorio.' })
  @IsNumber({}, { message: 'El porcentaje debe ser un número.' })
  @IsPositive({ message: 'El porcentaje debe ser mayor que 0.' })
  @IsPercentage({ message: 'El porcentaje debe respetar el formato decimal válido con hasta 2 decimales.' })
  porcentaje: number;

  @ApiProperty({
    type: Number,
    minimum: 0,
    exclusiveMinimum: true,
    description:
      'Cantidad en stock. Debe ser mayor que 0 y admite hasta 3 decimales.',
    example: 50,
  })
  @IsNotEmpty({ message: 'El stock es obligatorio.' })
  @IsNumber({}, { message: 'El stock debe ser un número.' })
  @IsPositive({ message: 'El stock debe ser mayor que 0.' })
  @IsQuantity({ message: 'El stock debe respetar el formato decimal válido con hasta 3 decimales.' })
  stock: number;

  @ApiProperty({
    type: Number,
    minimum: 0,
    exclusiveMinimum: true,
    description:
      'Stock mínimo del producto. Debe ser mayor que 0 y admite hasta 3 decimales.',
    example: 5,
  })
  @IsNotEmpty({ message: 'El stock mínimo es obligatorio.' })
  @IsNumber({}, { message: 'El stock mínimo debe ser un número.' })
  @IsPositive({ message: 'El stock mínimo debe ser mayor que 0.' })
  @IsQuantity({ message: 'El stock mínimo debe respetar el formato decimal válido con hasta 3 decimales.' })
  stockMinimo: number;

  @ApiProperty({
    type: Number,
    minimum: 1,
    description: 'ID de la línea asociada. Debe ser un entero positivo.',
    example: 3,
  })
  @IsNotEmpty({ message: 'La línea es obligatoria.' })
  @IsPositiveInteger({ message: 'La línea debe ser un número entero positivo.' })
  lineaId: number;

  @ApiProperty({
    type: Number,
    minimum: 1,
    description: 'ID de la marca asociada. Debe ser un entero positivo.',
    example: 2,
  })
  @IsNotEmpty({ message: 'La marca es obligatoria.' })
  @IsPositiveInteger({ message: 'La marca debe ser un número entero positivo.' })
  marcaId: number;

  @ApiProperty({
    type: Number,
    minimum: 1,
    description: 'ID de la presentación asociada. Debe ser un entero positivo.',
    example: 1,
  })
  @IsNotEmpty({ message: 'La presentación es obligatoria.' })
  @IsPositiveInteger({
    message: 'La presentación debe ser un número entero positivo.',
  })
  presentacionId: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Costo en dólares. Valor monetario con hasta 5 decimales.',
    example: 90.25,
  })
  @IsOptionalWhenUndefined()
  @IsNumber({}, { message: 'El costo en dólares debe ser un número.' })
  @IsMoney({ message: 'El costo en dólares debe ser un valor monetario válido con hasta 5 decimales.' })
  costoDolar?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Precio de venta. Valor monetario con hasta 5 decimales.',
    example: 150.75,
  })
  @IsOptionalWhenUndefined()
  @IsNumber({}, { message: 'El precio debe ser un número.' })
  @IsMoney({ message: 'El precio debe ser un valor monetario válido con hasta 5 decimales.' })
  precio?: number;

  @ApiProperty({
    enum: AlicuotaIva,
    enumName: 'AlicuotaIva',
    description: 'Alícuota de IVA aplicada al producto.',
    example: AlicuotaIva.ALICUOTA_21,
  })
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

  @ApiProperty({
    type: Number,
    minimum: 1,
    description: 'ID del usuario que crea el producto. Debe ser un entero positivo.',
    example: 1,
  })
  @IsNotEmpty({ message: 'El usuarioCreatedId es obligatorio.' })
  @IsPositiveInteger({
    message: 'El usuarioCreatedId debe ser un número entero positivo.',
  })
  usuarioCreatedId: number;
}

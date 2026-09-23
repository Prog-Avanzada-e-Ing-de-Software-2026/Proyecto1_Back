import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsInt,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { AlicuotaIva } from 'src/modules/organizacion/enums/alicuota-iva.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReferenciaDto } from 'src/modules/common/dto/referencia.dto';
/*
Se Utiliza cuando se necesita la entidad producto
*/
export class ProductoDto {
  @ApiProperty({ example: 123 })
  @Type(() => Number)
  @IsInt()
  id: number;

  @ApiProperty({
    example: 'Caja de tornillos',
    description:
      'Denominación o nombre del producto. Esta formado por la linea y la marca',
  })
  @IsString()
  denominacion: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Observaciones del producto.',
    example: '',
  })
  @IsString()
  observacion?: string;

  @ApiProperty({
    type: String,
    description: 'Código del proveedor del producto.',
    example: 'ABC-1234',
  })
  @IsString()
  codigoProveedor: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Código de barras del producto.',
    example: '7791234567890',
  })
  @IsString()
  codigoBarra?: string;

  @ApiProperty({
    type: Number,
    description: 'Cantidad en stock.',
    example: 50,
  })
  @IsInt()
  stock: number;

  @ApiProperty({
    type: Number,
    description: 'Costo del producto. Valor monetario con hasta 5 decimales.',
    example: 100.5,
  })
  @IsNumber()
  costo: number;

  @ApiProperty({
    type: Number,
    description: 'Precio de venta del producto. Valor monetario con hasta 5 decimales.',
    example: 150.75,
  })
  @IsNumber()
  precio: number;

  @ApiProperty({
    type: Number,
    description: 'Porcentaje de ganancia. Admite hasta 2 decimales.',
    example: 30.5,
  })
  @IsNumber()
  porcentaje: number;

  @ApiProperty({
    type: Boolean,
    description: 'Indica si el costo está expresado en dólares.',
    example: false,
  })
  @IsBoolean()
  costoEnDolar: boolean;

  @ApiProperty({
    type: Number,
    description: 'Costo en dólares. Valor monetario con hasta 5 decimales.',
    example: 90.25,
  })
  @IsNumber()
  costoDolar: number;

  @ApiProperty({
    type: Number,
    description: 'Cotización del dólar utilizada. Valor monetario con hasta 5 decimales.',
    example: 1150.5,
  })
  @IsNumber()
  cotizacionDolar: number;

  @ApiProperty({
    type: Number,
    description: 'Precio expresado en dólares. Valor monetario con hasta 5 decimales.',
    example: 13.05,
  })
  @Type(() => Number)
  @IsNumber()
  precioDolar: number;

  @ApiProperty({
    type: Boolean,
    description: 'Indica si el producto está destacado.',
    example: false,
  })
  @IsBoolean()
  destacado: boolean;

  @ApiProperty({
    type: Boolean,
    description: 'Indica si el producto tiene envío gratis.',
    example: false,
  })
  @IsBoolean()
  envioGratis: boolean;

  @ApiProperty({
    type: () => ReferenciaDto,
    description: 'Linea asociada al producto',
    required: true,
  })
  @ValidateNested()
  @Type(() => ReferenciaDto)
  linea?: ReferenciaDto;

  @ApiProperty({
    type: () => ReferenciaDto,
    description: 'Marca asociada al producto',
    required: true,
  })
  @ValidateNested()
  @Type(() => ReferenciaDto)
  marca?: ReferenciaDto;

  @ApiProperty({
    type: () => ReferenciaDto,
    description: 'Presentación asociada al producto',
    required: true,
  })
  @ValidateNested()
  @Type(() => ReferenciaDto)
  presentacion?: ReferenciaDto;

  @ApiProperty({
    type: () => ReferenciaDto,
    description: 'proveedor asociada al producto',
    required: true,
  })
  @ValidateNested()
  @Type(() => ReferenciaDto)
  proveedor?: ReferenciaDto;

  @ApiProperty({
    enum: AlicuotaIva,
    enumName: 'AlicuotaIva',
  })
  @IsEnum(AlicuotaIva)
  @Transform(({ value }) =>
    typeof value === 'string'
      ? AlicuotaIva[value.toUpperCase() as keyof typeof AlicuotaIva]
      : value,
  )
  alicuotaIva: AlicuotaIva;

  @ApiProperty({
    type: String,
    description: 'Ubicación física del producto.',
    example: 'Estante A1',
  })
  @IsString()
  ubicacion: string;

  @ApiProperty({
    type: Boolean,
    description: 'Indica si el producto utiliza stock mínimo.',
    example: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  utilizaStockMinimo: boolean;

  @ApiPropertyOptional({
    type: Number,
    description: 'Stock mínimo del producto.',
    example: 5,
  })
  @IsInt()
  stockMinimo: number;

  @ApiProperty({
    type: Boolean,
    description: 'Indica si el producto se comercializa por pack.',
    example: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  utilizaPack: boolean;

  @ApiPropertyOptional({
    type: Number,
    description: 'Cantidad de unidades por pack.',
    example: 6,
  })
  @IsInt()
  cantidadPorPack: number;

  @ApiProperty({ example: 123 })
  @Type(() => Number)
  @IsInt()
  sistema: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Código de referencia del producto.',
    example: 'REF-001',
  })
  @IsString()
  codigoReferencia?: string;

}

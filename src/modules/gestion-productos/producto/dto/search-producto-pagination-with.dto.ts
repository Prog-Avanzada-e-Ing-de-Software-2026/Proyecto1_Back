import { IsBoolean, IsInt, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptionalWhenUndefined,
  IsPositiveInteger,
  toQueryNumber,
  toStrictBoolean,
} from '../../common/validation/request-transforms';

export class SearchProductoPaginationWithDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Denominación a filtrar (coincidencia parcial).',
    example: 'tornillo',
  })
  @IsOptionalWhenUndefined()
  @IsString()
  denominacion?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Código de proveedor a filtrar.',
    example: 'ABC-1234',
  })
  @IsOptionalWhenUndefined()
  @IsString()
  codigoProveedor: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Código de referencia a filtrar.',
    example: 'REF-001',
  })
  @IsOptionalWhenUndefined()
  @IsString()
  codigoReferencia: string;

  @ApiProperty({
    type: Boolean,
    default: false,
    description: 'Indica si el código de referencia debe coincidir exactamente.',
    example: false,
  })
  @Transform(({ value }) => toStrictBoolean(value))
  @IsBoolean({ message: 'codReferenciaExacto debe ser un valor booleano.' })
  codReferenciaExacto: boolean = false;

  @ApiProperty({
    type: Boolean,
    default: false,
    description: 'Indica si el código de proveedor debe coincidir exactamente.',
    example: false,
  })
  @Transform(({ value }) => toStrictBoolean(value))
  @IsBoolean({ message: 'codProveedorExacto debe ser un valor booleano.' })
  codProveedorExacto: boolean = false;

  @ApiProperty({
    type: Number,
    minimum: 0,
    default: 0,
    description: 'Cantidad de elementos a omitir.',
    example: 0,
  })
  @IsInt({ message: 'skip debe ser un número entero.' })
  @Min(0, { message: 'skip debe ser un número entero positivo o 0' })
  @Transform(({ value }) => toQueryNumber(value))
  skip: number = 0;

  @ApiProperty({
    type: Number,
    minimum: 1,
    default: 10,
    description: 'Cantidad de elementos a retornar.',
    example: 10,
  })
  @IsInt({ message: 'take debe ser un número entero.' })
  @Min(1, { message: 'take debe ser un número entero mayor que 0' })
  @Transform(({ value }) => toQueryNumber(value))
  take: number = 10;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    description: 'ID de la marca a filtrar. Debe ser un entero positivo.',
    example: 2,
  })
  @IsOptionalWhenUndefined()
  @Transform(({ value }) => toQueryNumber(value))
  @IsPositiveInteger({ message: 'La marca debe ser un número entero positivo.' })
  marcaId: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    description: 'ID de la línea a filtrar. Debe ser un entero positivo.',
    example: 3,
  })
  @IsOptionalWhenUndefined()
  @Transform(({ value }) => toQueryNumber(value))
  @IsPositiveInteger({ message: 'La línea debe ser un número entero positivo.' })
  lineaId: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: 1,
    description: 'ID del proveedor a filtrar. Debe ser un entero positivo.',
    example: 4,
  })
  @IsOptionalWhenUndefined()
  @Transform(({ value }) => toQueryNumber(value))
  @IsPositiveInteger({ message: 'El proveedor debe ser un número entero positivo.' })
  proveedorId: number;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Indica si solo se deben incluir productos con stock.',
    example: false,
  })
  @IsOptionalWhenUndefined()
  @Transform(({ value }) => toStrictBoolean(value))
  @IsBoolean({ message: 'conStock debe ser un valor booleano.' })
  conStock: boolean;
}

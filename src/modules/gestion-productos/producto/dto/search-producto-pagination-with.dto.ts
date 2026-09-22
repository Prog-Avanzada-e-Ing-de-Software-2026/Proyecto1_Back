import { IsBoolean, IsInt, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  IsOptionalWhenUndefined,
  IsPositiveInteger,
  toQueryNumber,
  toStrictBoolean,
} from '../../common/validation/request-validation.helpers';

export class SearchProductoPaginationWithDto {
  @IsOptionalWhenUndefined()
  @IsString()
  denominacion?: string;

  @IsOptionalWhenUndefined()
  @IsString()
  codigoProveedor: string;

  @IsOptionalWhenUndefined()
  @IsString()
  codigoReferencia: string;

  @Transform(({ value }) => toStrictBoolean(value))
  @IsBoolean({ message: 'codReferenciaExacto debe ser un valor booleano.' })
  codReferenciaExacto: boolean = false;

  @Transform(({ value }) => toStrictBoolean(value))
  @IsBoolean({ message: 'codProveedorExacto debe ser un valor booleano.' })
  codProveedorExacto: boolean = false;

  @IsInt({ message: 'skip debe ser un número entero.' })
  @Min(0, { message: 'skip debe ser un número entero positivo o 0' })
  @Transform(({ value }) => toQueryNumber(value))
  skip: number = 0;

  @IsInt({ message: 'take debe ser un número entero.' })
  @Min(1, { message: 'take debe ser un número entero mayor que 0' })
  @Transform(({ value }) => toQueryNumber(value))
  take: number = 10;

  @IsOptionalWhenUndefined()
  @Transform(({ value }) => toQueryNumber(value))
  @IsPositiveInteger({ message: 'La marca debe ser un número entero positivo.' })
  marcaId: number;

  @IsOptionalWhenUndefined()
  @Transform(({ value }) => toQueryNumber(value))
  @IsPositiveInteger({ message: 'La línea debe ser un número entero positivo.' })
  lineaId: number;

  @IsOptionalWhenUndefined()
  @Transform(({ value }) => toQueryNumber(value))
  @IsPositiveInteger({ message: 'El proveedor debe ser un número entero positivo.' })
  proveedorId: number;

  @Transform(({ value }) => toStrictBoolean(value))
  @IsBoolean({ message: 'conStock debe ser un valor booleano.' })
  conStock: boolean;
}

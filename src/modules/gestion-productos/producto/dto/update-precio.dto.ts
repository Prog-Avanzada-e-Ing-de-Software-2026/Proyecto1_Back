import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsPositive, Min } from 'class-validator';
import {
  IsMoney,
  IsPercentage,
  IsPositiveInteger,
  toQueryNumber,
} from '../../common/validation/request-transforms';

export class UpdatePrecioDto {
  @ApiProperty({
    example: 100.5,
    description: 'Costo en moneda local. Valor monetario con hasta 5 decimales.',
    type: Number,
    minimum: 0,
  })
  @Transform(({ value }) => toQueryNumber(value))
  @IsNumber({}, { message: 'El costo debe ser un número.' })
  @Min(0, { message: 'El costo debe ser mayor o igual a 0.' })
  @IsMoney({ message: 'El costo debe respetar el formato monetario válido con hasta 5 decimales.' })
  costo: number;

  @ApiProperty({
    example: 50.25,
    description: 'Costo en dólares. Valor monetario con hasta 5 decimales.',
    type: Number,
    minimum: 0,
  })
  @Transform(({ value }) => toQueryNumber(value))
  @IsNumber({}, { message: 'El costo en dólares debe ser un número.' })
  @Min(0, { message: 'El costo en dólares debe ser mayor o igual a 0.' })
  @IsMoney({ message: 'El costo en dólares debe respetar el formato monetario válido con hasta 5 decimales.' })
  costoDolar: number;

  @ApiProperty({
    example: 50.25,
    description: 'Cotización del dólar. Valor monetario con hasta 5 decimales.',
    type: Number,
    minimum: 0,
  })
  @Transform(({ value }) => toQueryNumber(value))
  @IsNumber({}, { message: 'La cotización del dólar debe ser un número.' })
  @Min(0, { message: 'La cotización del dólar debe ser mayor o igual a 0.' })
  @IsMoney({ message: 'La cotización del dólar debe respetar el formato monetario válido con hasta 5 decimales.' })
  cotizacionDolar: number;

  @ApiProperty({
    example: 10,
    description:
      'Porcentaje de aumento. Debe ser mayor que 0 y admite hasta 2 decimales.',
    type: Number,
    minimum: 0,
    exclusiveMinimum: true,
  })
  @Transform(({ value }) => toQueryNumber(value))
  @IsNumber({}, { message: 'El porcentaje debe ser un número.' })
  @IsPositive({ message: 'El porcentaje debe ser mayor que 0.' })
  @IsPercentage({ message: 'El porcentaje debe respetar el formato decimal válido con hasta 2 decimales.' })
  porcentaje: number;

  @ApiProperty({
    example: 3,
    description: 'ID del usuario que realiza la actualización. Debe ser un entero positivo.',
    type: Number,
    minimum: 1,
  })
  @Transform(({ value }) => toQueryNumber(value))
  @IsPositiveInteger({ message: 'El usuarioId debe ser un número entero positivo.' })
  usuarioId: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { MotivoCambioPrecio } from '../enums/motivo-cambio-precio.enum';

export class CambioPrecioDto {
  @ApiProperty({
    example: '2026-09-13T15:00:00.000Z',
    description: 'Fecha y hora en la que se registró el cambio de precio.',
  })
  fecha: Date;

  @ApiProperty({
    example: 120,
    description: 'Precio del producto antes del cambio.',
  })
  precioAnterior: number;

  @ApiProperty({
    example: 132,
    description: 'Precio del producto después del cambio.',
  })
  precioNuevo: number;

  @ApiProperty({
    enum: MotivoCambioPrecio,
    description: 'Motivo que originó el cambio de precio.',
  })
  motivo: MotivoCambioPrecio;
}
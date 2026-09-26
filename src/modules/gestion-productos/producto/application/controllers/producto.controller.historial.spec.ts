import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ProductoController } from './producto.controller';
import { ProductoService } from '../services/producto.service';
import { MotivoCambioPrecio } from '../../enums/motivo-cambio-precio.enum';

describe('ProductoController - historial de precios', () => {
  let controller: ProductoController;
  const getHistorialPrecios = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductoController],
      providers: [
        { provide: ProductoService, useValue: { getHistorialPrecios } },
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: {} },
        Reflector,
        { provide: 'IUsuarioRepository', useValue: {} },
      ],
    }).compile();

    controller = module.get<ProductoController>(ProductoController);
  });

  it('debe exponer el historial de precios paginado', async () => {
    const cambios = [
      {
        fecha: new Date('2026-09-01T12:00:00.000Z'),
        precioAnterior: 120,
        precioNuevo: 132,
        motivo: MotivoCambioPrecio.ActualizacionDePrecioGlobal,
      },
    ];
    getHistorialPrecios.mockResolvedValue(cambios);

    const result = await controller.historialPrecios(7, { skip: 0, take: 5 });

    expect(getHistorialPrecios).toHaveBeenCalledWith(7, { skip: 0, take: 5 });
    expect(result).toEqual(cambios);
  });
});
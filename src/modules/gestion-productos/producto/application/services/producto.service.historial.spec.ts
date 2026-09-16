import { ProductoService } from './producto.service';
import { CambioPrecio } from '../../domain/entities/cambio-precio.entity';
import { MotivoCambioPrecio } from '../../enums/motivo-cambio-precio.enum';

function crearCambio(
  precioAnterior: number,
  precioNuevo: number,
  motivo: MotivoCambioPrecio,
  fecha = new Date('2026-09-01T12:00:00.000Z'),
): CambioPrecio {
  const cambio = new CambioPrecio();
  cambio.id = Math.floor(Math.random() * 1000);
  cambio.precioAnterior = precioAnterior;
  cambio.precioNuevo = precioNuevo;
  cambio.motivo = motivo;
  cambio.fecha = fecha;
  return cambio;
}

function crearService(repo: any) {
  return new ProductoService(
    repo,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
}

describe('ProductoService - historial de precios', () => {
  it('debe consultar el historial con la paginación provista y mapear los cambios', async () => {
    const cambios = [
      crearCambio(120, 132, MotivoCambioPrecio.ActualizacionDePrecioGlobal),
      crearCambio(132, 150, MotivoCambioPrecio.ActualizacionDePrecioDirecta),
    ];
    const repo = {
      findOne: jest.fn().mockResolvedValue({ id: 1 }),
      findHistorialPrecios: jest.fn().mockResolvedValue(cambios),
    } as any;
    const service = crearService(repo);

    const result = await service.getHistorialPrecios(1, { skip: 0, take: 10 });

    expect(repo.findOne).toHaveBeenCalledWith(1);
    expect(repo.findHistorialPrecios).toHaveBeenCalledWith(1, 0, 10);
    expect(result).toEqual([
      {
        fecha: cambios[0].fecha,
        precioAnterior: 120,
        precioNuevo: 132,
        motivo: MotivoCambioPrecio.ActualizacionDePrecioGlobal,
      },
      {
        fecha: cambios[1].fecha,
        precioAnterior: 132,
        precioNuevo: 150,
        motivo: MotivoCambioPrecio.ActualizacionDePrecioDirecta,
      },
    ]);
  });

  it('debe aplicar paginación por defecto cuando no se provee', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue({ id: 1 }),
      findHistorialPrecios: jest.fn().mockResolvedValue([]),
    } as any;
    const service = crearService(repo);

    const result = await service.getHistorialPrecios(1, {});

    expect(repo.findHistorialPrecios).toHaveBeenCalledWith(1, 0, 10);
    expect(result).toEqual([]);
  });

  it('debe rechazar el historial cuando el producto no existe o está eliminado', async () => {
    const repo = {
      findOne: jest.fn().mockResolvedValue(null),
      findHistorialPrecios: jest.fn(),
    } as any;
    const service = crearService(repo);

    await expect(service.getHistorialPrecios(999, {})).rejects.toThrow(
      'no encontrado',
    );
    expect(repo.findHistorialPrecios).not.toHaveBeenCalled();
  });
});
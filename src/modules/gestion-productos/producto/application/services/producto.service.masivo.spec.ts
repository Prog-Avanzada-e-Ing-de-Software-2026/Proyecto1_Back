import { ProductoService } from './producto.service';
import { Producto } from '../../domain/entities/producto.entity';
import { TipoAumento } from 'src/modules/common/enums/tipo-aumento.emun';
import { OperacionAjuste } from 'src/modules/common/enums/operacion-ajuste.enum';

describe('ProductoService - actualización masiva', () => {
  it('debe aplicar aumento por porcentaje a todos los productos y devolver resumen', async () => {
    const producto1 = new Producto();
    producto1.id = 1;
    producto1.denominacion = 'A';
    producto1.costo = 100;
    producto1.precio = 100;
    producto1.porcentaje = 20;
    producto1.lineaId = 5;

    const producto2 = new Producto();
    producto2.id = 2;
    producto2.denominacion = 'B';
    producto2.costo = 200;
    producto2.precio = 200;
    producto2.porcentaje = 20;
    producto2.lineaId = 5;

    const usuario = { id: 7 } as any;
    const repo = {
      findBy: jest.fn().mockResolvedValue({ data: [producto1, producto2], total: 2 }),
      actualizarPrecios: jest.fn().mockImplementation(async (items) => items),
      existsProductosActivosByMarca: jest.fn(),
      existsProductosActivosByLinea: jest.fn(),
      findByIds: jest.fn(),
      findOne: jest.fn(),
      findByIdConAuditoria: jest.fn(),
      findByDenominacionCodigoProveedorFiltered: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      isCodigoProveedorDuplicado: jest.fn(),
      existsByDenominacion: jest.fn(),
      existsByCodigoProveedor: jest.fn(),
      findByRapido: jest.fn(),
    } as any;

    const usuarioService = { findOne: jest.fn().mockResolvedValue(usuario) } as any;

    const service = new ProductoService(
      repo,
      {} as any,
      {} as any,
      {} as any,
      usuarioService,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const result = await service.actualizarPrecios(
      {
        tipoAjuste: TipoAumento.PORCENTAJE,
        operacion: OperacionAjuste.AUMENTO,
        valor: 10,
      } as any,
      usuario,
    );

    expect(producto1.precio).toBeCloseTo(110);
    expect(producto1.costo).toBeCloseTo(91.67);
    expect(producto2.precio).toBeCloseTo(220);
    expect(producto2.costo).toBeCloseTo(183.33);
    expect(repo.actualizarPrecios).toHaveBeenCalledTimes(1);
    expect(result.productos).toEqual([
      { denominacion: 'A', costo: 91.67, precio: 110 },
      { denominacion: 'B', costo: 183.33, precio: 220 },
    ]);
  });
});

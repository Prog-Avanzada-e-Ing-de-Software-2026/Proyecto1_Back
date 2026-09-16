import { ProductoService } from './producto.service';
import { Producto } from '../../domain/entities/producto.entity';
import { TipoAumento } from 'src/modules/common/enums/tipo-aumento.emun';
import { OperacionAjuste } from 'src/modules/common/enums/operacion-ajuste.enum';
import { MotivoCambioPrecio } from '../../enums/motivo-cambio-precio.enum';

function crearProducto(id: number, denominacion: string, lineaId?: number): Producto {
  const producto = new Producto();
  producto.id = id;
  producto.denominacion = denominacion;
  producto.costo = 100;
  producto.precio = 100;
  producto.porcentaje = 20;
  if (lineaId !== undefined) {
    producto.lineaId = lineaId;
  }
  return producto;
}

function crearRepo(productos: Producto[]) {
  return {
    findBy: jest.fn().mockResolvedValue({ data: productos, total: productos.length }),
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
}

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
    expect(repo.findBy).toHaveBeenCalledWith('', '', false, '', 0, 0, 0, false, 0, 10000, true);
    expect(repo.actualizarPrecios).toHaveBeenCalledTimes(1);
    expect(producto1.cambiosPrecio).toHaveLength(1);
    expect(producto1.cambiosPrecio[0].motivo).toBe(
      MotivoCambioPrecio.ActualizacionDePrecioGlobal,
    );
    expect(result.productos).toEqual([
      { denominacion: 'A', costo: 91.67, precio: 110 },
      { denominacion: 'B', costo: 183.33, precio: 220 },
    ]);
  });

  it('debe usar el motivo por línea cuando la actualización está filtrada por línea', async () => {
    const producto = crearProducto(1, 'A', 5);

    const usuario = { id: 7 } as any;
    const repo = crearRepo([producto]);
    const service = crearService(repo, usuario);

    await service.actualizarPrecios(
      {
        lineaId: 5,
        tipoAjuste: TipoAumento.MONTO_FIJO,
        operacion: OperacionAjuste.AUMENTO,
        valor: 10,
      } as any,
      usuario,
    );

    expect(repo.findBy).toHaveBeenCalledWith('', '', false, '', 0, 5, 0, false, 0, 10000, true);
    expect(producto.cambiosPrecio).toHaveLength(1);
    expect(producto.cambiosPrecio[0].motivo).toBe(
      MotivoCambioPrecio.ActualizacionDePrecioPorLinea,
    );
  });
});

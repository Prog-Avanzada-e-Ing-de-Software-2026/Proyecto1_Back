import { ProductoService } from './producto.service';
import { Producto } from '../../domain/entities/producto.entity';
import { TipoAumento } from 'src/modules/common/enums/tipo-aumento.emun';
import { OperacionAjuste } from 'src/modules/common/enums/operacion-ajuste.enum';
import { MotivoCambioPrecio } from '../../enums/motivo-cambio-precio.enum';

function crearProducto(id: number, denominacion: string, lineaId?: number): Producto {
  const producto = new Producto();
  producto.id = id;
  producto.denominacion = denominacion;
  producto.costo = id === 2 ? 200 : 100;
  producto.precio = id === 2 ? 200 : 100;
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

function crearService(repo: any, usuario: any) {
  const usuarioService = { findOne: jest.fn().mockResolvedValue(usuario) } as any;

  return new ProductoService(
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
}

describe('ProductoService - actualización masiva de precios', () => {
  it('debe actualizar precios globalmente y conservar el margen', async () => {
    const producto1 = crearProducto(1, 'A');
    const producto2 = crearProducto(2, 'B');
    const usuario = { id: 7 } as any;
    const repo = crearRepo([producto1, producto2]);
    const service = crearService(repo, usuario);

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

describe('ProductoService - actualización masiva de precios por ajuste único', () => {
  // Variantes de CP-39/CP-40: [operación, tipo de ajuste, valor]
  const variantes = [
    ['AUMENTO', 'MONTO_FIJO', 20],
    ['DISMINUCION', 'MONTO_FIJO', 20],
    ['AUMENTO', 'PORCENTAJE', 10],
    ['DISMINUCION', 'PORCENTAJE', 10],
  ] as const;

  function tipoAjusteDe(tipo: string): TipoAumento {
    return tipo === 'MONTO_FIJO' ? TipoAumento.MONTO_FIJO : TipoAumento.PORCENTAJE;
  }

  function precioEsperado(
    operacion: string,
    tipo: string,
    valor: number,
    precioBase: number,
  ): number {
    if (tipo === 'MONTO_FIJO') {
      return operacion === 'AUMENTO' ? precioBase + valor : precioBase - valor;
    }
    return operacion === 'AUMENTO'
      ? precioBase * (1 + valor / 100)
      : precioBase * (1 - valor / 100);
  }

  it.each(variantes)(
    'CP - Actualizar precios globalmente mediante un único ajuste (%s %s %s)',
    async (operacion, tipo, valor) => {
      const producto = crearProducto(1, 'A');
      const usuario = { id: 7 } as any;
      const repo = crearRepo([producto]);
      const service = crearService(repo, usuario);

      const result = await service.actualizarPrecios(
        {
          tipoAjuste: tipoAjusteDe(tipo),
          operacion,
          valor,
        } as any,
        usuario,
      );

      const esperado = precioEsperado(operacion, tipo, valor, 100);

      expect(repo.findBy).toHaveBeenCalledWith('', '', false, '', 0, 0, 0, false, 0, 10000, true);
      expect(producto.precio).toBeCloseTo(esperado);
      expect(producto.costo).toBeCloseTo(esperado / 1.2);
      expect(producto.cambiosPrecio).toHaveLength(1);
      expect(producto.cambiosPrecio[0].motivo).toBe(
        MotivoCambioPrecio.ActualizacionDePrecioGlobal,
      );
      expect(repo.actualizarPrecios).toHaveBeenCalledTimes(1);
      expect(result.message).toBe('Actualización de precios realizada correctamente.');
      expect(result.productos[0].denominacion).toBe('A');
      expect(result.productos[0].costo).toBeCloseTo(esperado / 1.2);
      expect(result.productos[0].precio).toBeCloseTo(esperado);
    },
  );

  it.each(variantes)(
    'CP - Actualizar precios de una línea mediante un único ajuste (%s %s %s)',
    async (operacion, tipo, valor) => {
      const productoDeLaLinea = crearProducto(1, 'A', 5);
      const productoDeOtraLinea = crearProducto(2, 'B', 9);
      const usuario = { id: 7 } as any;
      // findBy devuelve SOLO los productos de la línea 5
      const repo = crearRepo([productoDeLaLinea]);
      const service = crearService(repo, usuario);

      await service.actualizarPrecios(
        {
          lineaId: 5,
          tipoAjuste: tipoAjusteDe(tipo),
          operacion,
          valor,
        } as any,
        usuario,
      );

      expect(repo.findBy).toHaveBeenCalledWith('', '', false, '', 0, 5, 0, false, 0, 10000, true);
      expect(productoDeLaLinea.cambiosPrecio).toHaveLength(1);
      expect(productoDeLaLinea.cambiosPrecio[0].motivo).toBe(
        MotivoCambioPrecio.ActualizacionDePrecioPorLinea,
      );
      // Nada fuera del conjunto devuelto por findBy es tocado ni persistido.
      expect(productoDeOtraLinea.cambiosPrecio).toBeUndefined();
      expect(productoDeOtraLinea.precio).toBe(200);
      expect(repo.actualizarPrecios).toHaveBeenCalledWith(
        [productoDeLaLinea],
        usuario,
      );
    },
  );

  it('CP - Rechazar una disminución que produzca algún precio no positivo', async () => {
    const producto = crearProducto(1, 'A');
    producto.costo = 50;
    producto.precio = 50;
    const usuario = { id: 7 } as any;
    const repo = crearRepo([producto]);
    const service = crearService(repo, usuario);

    await expect(
      service.actualizarPrecios(
        {
          tipoAjuste: TipoAumento.MONTO_FIJO,
          operacion: OperacionAjuste.DISMINUCION,
          valor: 50,
        } as any,
        usuario,
      ),
    ).rejects.toThrow('El precio final debe ser mayor que 0.');

    expect(repo.actualizarPrecios).not.toHaveBeenCalled();
    expect(producto.precio).toBe(50);
    expect(producto.costo).toBe(50);
  });

  it('CP - Informar que no existen productos para actualizar', async () => {
    const usuario = { id: 7 } as any;
    const repo = crearRepo([]);
    const service = crearService(repo, usuario);

    await expect(
      service.actualizarPrecios(
        {
          tipoAjuste: TipoAumento.PORCENTAJE,
          operacion: OperacionAjuste.AUMENTO,
          valor: 10,
        } as any,
        usuario,
      ),
    ).rejects.toThrow('No se encontraron productos para actualizar.');

    expect(repo.actualizarPrecios).not.toHaveBeenCalled();
  });
});

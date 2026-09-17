import { DataSource } from 'typeorm';
import {
  createInitializedTestDataSource,
  createUnitOfWorkStub,
  truncateTables,
} from '../../../../../../test/integration/test-datasource';
import { CambioPrecio } from '../../domain/entities/cambio-precio.entity';
import { Producto } from '../../domain/entities/producto.entity';
import { ProductoPersistenceAdapter } from './producto.persistence-adapters';

describe('ProductoPersistenceAdapter - CR-004 persistence queries', () => {
  let dataSource: DataSource;
  let adapter: ProductoPersistenceAdapter;
  let presentacionId: number;

  beforeAll(async () => {
    dataSource = await createInitializedTestDataSource();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await truncateTables(dataSource);
    presentacionId = await createPresentacion('Presentacion CR-004');
    adapter = new ProductoPersistenceAdapter(
      dataSource.getRepository(Producto),
      dataSource.getRepository(CambioPrecio),
      dataSource,
      createUnitOfWorkStub(dataSource),
    );
  });

  async function createPresentacion(denominacion: string): Promise<number> {
    const result = await dataSource.query(
      'INSERT INTO `presentacion` (`denominacion`) VALUES (?)',
      [denominacion],
    );
    return result.insertId as number;
  }

  async function createSuperLinea(denominacion: string, deletedAt: Date | null = null): Promise<number> {
    const result = await dataSource.query(
      'INSERT INTO `super_linea` (`denominacion`, `deletedAt`) VALUES (?, ?)',
      [denominacion, deletedAt],
    );
    return result.insertId as number;
  }

  async function createLinea(denominacion: string, superLineaId: number, deletedAt: Date | null = null): Promise<number> {
    const result = await dataSource.query(
      'INSERT INTO `linea` (`denominacion`, `super_linea_id`, `deletedAt`) VALUES (?, ?, ?)',
      [denominacion, superLineaId, deletedAt],
    );
    return result.insertId as number;
  }

  async function createProducto(denominacion: string, lineaId: number, deletedAt: Date | null = null): Promise<number> {
    const result = await dataSource.query(
      'INSERT INTO `producto` (`denominacion`, `linea_id`, `presentacion_id`, `deletedAt`) VALUES (?, ?, ?, ?)',
      [denominacion, lineaId, presentacionId, deletedAt],
    );
    return result.insertId as number;
  }

  describe('busquedaPorCoincidenciaParcial', () => {
    it('CP-70 - La búsqueda no distingue mayúsculas de minúsculas', async () => {
      const superLineaId = await createSuperLinea('Almacen');
      const lineaId = await createLinea('Almacen linea', superLineaId);
      await createProducto('Harina integral', lineaId);

      const result = await adapter.busquedaPorCoincidenciaParcial('harina');

      expect(result.total).toBe(1);
      expect(result.data.map((producto) => producto.denominacion)).toEqual([
        'Harina integral',
      ]);
    });

    it('CP-71 - Buscar "harina" no devuelve "harína"', async () => {
      const superLineaId = await createSuperLinea('Almacen');
      const lineaId = await createLinea('Almacen linea', superLineaId);
      await createProducto('harína premium', lineaId);
      await createProducto('Harina integral', lineaId);

      const result = await adapter.busquedaPorCoincidenciaParcial('harina');

      expect(result.total).toBe(1);
      expect(result.data.map((producto) => producto.denominacion)).toEqual([
        'Harina integral',
      ]);
    });

    it('CP-71 - Un término con tilde solo coincide con denominaciones con tilde', async () => {
      const superLineaId = await createSuperLinea('Almacen');
      const lineaId = await createLinea('Almacen linea', superLineaId);
      await createProducto('harína premium', lineaId);
      await createProducto('Harina integral', lineaId);

      const result = await adapter.busquedaPorCoincidenciaParcial('harína');

      expect(result.total).toBe(1);
      expect(result.data.map((producto) => producto.denominacion)).toEqual([
        'harína premium',
      ]);
    });

    it('CP-68 - Un término sin coincidencias devuelve una colección vacía', async () => {
      const superLineaId = await createSuperLinea('Almacen');
      const lineaId = await createLinea('Almacen linea', superLineaId);
      await createProducto('Arroz', lineaId);

      const result = await adapter.busquedaPorCoincidenciaParcial('trigo');

      expect(result).toEqual({ data: [], total: 0 });
    });

    it('CP-72 - Un término vacío o de solo espacios devuelve una colección vacía', async () => {
      await expect(
        adapter.busquedaPorCoincidenciaParcial(''),
      ).resolves.toEqual({ data: [], total: 0 });
      await expect(
        adapter.busquedaPorCoincidenciaParcial('   '),
      ).resolves.toEqual({ data: [], total: 0 });
    });

    it('CP-73 - Solo se devuelven productos activos (excluye los eliminados lógicamente)', async () => {
      const superLineaId = await createSuperLinea('Almacen');
      const lineaId = await createLinea('Almacen linea', superLineaId);
      await createProducto('Harina activa', lineaId);
      await createProducto('Harina borrada', lineaId, new Date());

      const result = await adapter.busquedaPorCoincidenciaParcial('harina');

      expect(result.total).toBe(1);
      expect(result.data.map((producto) => producto.denominacion)).toEqual([
        'Harina activa',
      ]);
    });

    it('CP-69 - La coincidencia no tiene que estar al principio de la denominación', async () => {
      const superLineaId = await createSuperLinea('Almacen');
      const lineaId = await createLinea('Almacen linea', superLineaId);
      await createProducto('HARINA 000', lineaId);

      const result = await adapter.busquedaPorCoincidenciaParcial('RINA');

      expect(result.total).toBe(1);
      expect(result.data.map((producto) => producto.denominacion)).toEqual([
        'HARINA 000',
      ]);
    });

    it('CP-74 - El carácter % se busca de forma literal y no como comodín', async () => {
      const superLineaId = await createSuperLinea('Almacen');
      const lineaId = await createLinea('Almacen linea', superLineaId);
      await createProducto('OFERTA 50% DESCUENTO', lineaId);
      await createProducto('SIN DESCUENTO', lineaId);

      const result = await adapter.busquedaPorCoincidenciaParcial('%');

      const denominaciones = result.data.map(
        (producto) => producto.denominacion,
      );
      expect(result.total).toBe(1);
      expect(denominaciones).not.toContain('SIN DESCUENTO');
      expect(denominaciones).toContain('OFERTA 50% DESCUENTO');
    });

    it('CP-75 - El carácter _ se busca de forma literal y no como comodín', async () => {
      const superLineaId = await createSuperLinea('Almacen');
      const lineaId = await createLinea('Almacen linea', superLineaId);
      await createProducto('PRODUCTO_A', lineaId);
      await createProducto('PRODUCTOXA', lineaId);

      const result = await adapter.busquedaPorCoincidenciaParcial('_');

      const denominaciones = result.data.map(
        (producto) => producto.denominacion,
      );
      expect(result.total).toBe(1);
      expect(denominaciones).not.toContain('PRODUCTOXA');
      expect(denominaciones).toContain('PRODUCTO_A');
    });

    it('CP-77 - Los resultados vienen ordenados ascendentemente por denominación', async () => {
      const superLineaId = await createSuperLinea('Almacen');
      const lineaId = await createLinea('Almacen linea', superLineaId);
      await createProducto('GASEOSA COLA', lineaId);
      await createProducto('AGUA 01', lineaId);
      // The catalog uses "FIDEOS", which does not contain "A"; the Given
      // requires the term to be present in all three denominations.
      await createProducto('FIDEOS AL HUEVO', lineaId);

      const result = await adapter.busquedaPorCoincidenciaParcial('A');

      expect(result.data.map((producto) => producto.denominacion)).toEqual([
        'AGUA 01',
        'FIDEOS AL HUEVO',
        'GASEOSA COLA',
      ]);
    });

    it('CP-76 - Paginar de a 10 informando el total real de coincidencias', async () => {
      const superLineaId = await createSuperLinea('Almacen');
      const lineaId = await createLinea('Almacen linea', superLineaId);
      for (let index = 1; index <= 12; index += 1) {
        await createProducto(`Harina ${String(index).padStart(2, '0')}`, lineaId);
      }

      const firstPage = await adapter.busquedaPorCoincidenciaParcial('harina', 0, 10);
      const secondPage = await adapter.busquedaPorCoincidenciaParcial('harina', 10, 10);

      expect(firstPage.data).toHaveLength(10);
      expect(firstPage.total).toBe(12);
      expect(secondPage.data).toHaveLength(2);
      expect(secondPage.total).toBe(12);
    });
  });

  describe('findProductosBySuperLinea', () => {
    it('CP-90 - Devuelve los productos de al menos dos líneas que pertenecen a la superlínea', async () => {
      const superLineaId = await createSuperLinea('Almacen');
      const lineaAId = await createLinea('Linea A', superLineaId);
      const lineaBId = await createLinea('Linea B', superLineaId);
      await createProducto('Producto A', lineaAId);
      await createProducto('Producto B', lineaBId);

      const result = await adapter.findProductosBySuperLinea(superLineaId);

      expect(result.total).toBe(2);
      const lineas = new Set(result.data.map((producto) => producto.linea?.id));
      expect(lineas.size).toBe(2);
    });

    it('CP-91 - Los productos de la superlínea excluyen producto, línea y superlínea eliminados', async () => {
      const activeSuperLineaId = await createSuperLinea('Activa');
      const activeLineaId = await createLinea('Linea activa', activeSuperLineaId);
      const deletedLineaId = await createLinea('Linea borrada', activeSuperLineaId, new Date());
      const deletedSuperLineaId = await createSuperLinea('Borrada', new Date());
      const lineaUnderDeletedSuperLineaId = await createLinea('Linea huerfana', deletedSuperLineaId);

      await createProducto('Producto visible', activeLineaId);
      await createProducto('Producto borrado', activeLineaId, new Date());
      await createProducto('Producto de linea borrada', deletedLineaId);
      await createProducto('Producto de superlinea borrada', lineaUnderDeletedSuperLineaId);

      const activeResult = await adapter.findProductosBySuperLinea(activeSuperLineaId);
      const deletedResult = await adapter.findProductosBySuperLinea(deletedSuperLineaId);

      expect(activeResult.total).toBe(1);
      expect(activeResult.data.map((producto) => producto.denominacion)).toEqual([
        'Producto visible',
      ]);
      expect(deletedResult).toEqual({ data: [], total: 0 });
    });

    it('CP-90 - Pagina de a 10 informando el total real de coincidencias', async () => {
      const superLineaId = await createSuperLinea('Almacen');
      const lineaId = await createLinea('Almacen linea', superLineaId);
      for (let index = 1; index <= 15; index += 1) {
        await createProducto(`Producto ${String(index).padStart(2, '0')}`, lineaId);
      }

      const firstPage = await adapter.findProductosBySuperLinea(superLineaId, 0, 10);
      const secondPage = await adapter.findProductosBySuperLinea(superLineaId, 10, 10);

      expect(firstPage.data).toHaveLength(10);
      expect(firstPage.total).toBe(15);
      expect(secondPage.data).toHaveLength(5);
      expect(secondPage.total).toBe(15);
    });

    it('CP-92 - Un identificador de superlínea inexistente no devuelve productos', async () => {
      await expect(
        adapter.findProductosBySuperLinea(999999),
      ).resolves.toEqual({ data: [], total: 0 });
    });
  });

  describe('findBy - productos de la línea seleccionada', () => {
    // Mirrors `/api/producto/search-by` defaults when no pagination is sent:
    // skip = 0, take = 10 (SearchProductoPaginationWithDto).
    function buscarPorLinea(
      lineaId: number,
      skip = 0,
      take = 10,
    ): Promise<{ data: Producto[]; total: number }> {
      return adapter.findBy('', '', false, '', 0, lineaId, 0, false, skip, take);
    }

    it('CP-88 - Traer los productos de la línea seleccionada, paginados de a 10', async () => {
      const superLineaId = await createSuperLinea('Bebidas');
      const lineaId = await createLinea('AGUAS', superLineaId);
      for (let index = 1; index <= 11; index += 1) {
        await createProducto(`Agua ${String(index).padStart(2, '0')}`, lineaId);
      }

      const firstPage = await buscarPorLinea(lineaId);
      const secondPage = await buscarPorLinea(lineaId, 10, 10);

      expect(firstPage.data).toHaveLength(10);
      expect(firstPage.total).toBe(11);
      expect(secondPage.data).toHaveLength(1);
    });

    it('CP-89 - Los productos de la línea seleccionada excluyen los eliminados', async () => {
      const superLineaId = await createSuperLinea('Bebidas');
      const lineaId = await createLinea('AGUAS', superLineaId);
      await createProducto('Agua activa', lineaId);
      await createProducto('Agua eliminada', lineaId, new Date());

      const result = await buscarPorLinea(lineaId);

      expect(result.total).toBe(1);
      expect(result.data.map((producto) => producto.denominacion)).toEqual([
        'Agua activa',
      ]);
    });
  });
});

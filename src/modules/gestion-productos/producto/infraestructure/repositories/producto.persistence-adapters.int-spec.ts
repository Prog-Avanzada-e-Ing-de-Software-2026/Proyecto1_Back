import { DataSource } from 'typeorm';
import {
  createInitializedTestDataSource,
  createUnitOfWorkStub,
  truncateTables,
} from '../../../../../../test/integration/test-datasource';
import { Producto } from '../../domain/entities/producto.entity';
import { ProductoPersistenceAdapter } from './producto.persistence-adapters';

describe('ProductoPersistenceAdapter - CR-004 persistence queries', () => {
  let dataSource: DataSource;
  let adapter: ProductoPersistenceAdapter;

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
    adapter = new ProductoPersistenceAdapter(
      dataSource.getRepository(Producto),
      dataSource,
      createUnitOfWorkStub(dataSource),
    );
  });

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
      'INSERT INTO `producto` (`denominacion`, `linea_id`, `deletedAt`) VALUES (?, ?, ?)',
      [denominacion, lineaId, deletedAt],
    );
    return result.insertId as number;
  }

  describe('busquedaPorCoincidenciaParcial', () => {
    it('matches case-insensitively against the real MySQL collation', async () => {
      const superLineaId = await createSuperLinea('Almacen');
      const lineaId = await createLinea('Almacen linea', superLineaId);
      await createProducto('Harina integral', lineaId);

      const result = await adapter.busquedaPorCoincidenciaParcial('harina');

      expect(result.total).toBe(1);
      expect(result.data.map((producto) => producto.denominacion)).toEqual([
        'Harina integral',
      ]);
    });

    it('is accent-sensitive and does not match harína when searching harina', async () => {
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

    it('matches an accented term against an accented denominación only', async () => {
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

    it('returns an empty page when the term is not contained in any denominación', async () => {
      const superLineaId = await createSuperLinea('Almacen');
      const lineaId = await createLinea('Almacen linea', superLineaId);
      await createProducto('Arroz', lineaId);

      const result = await adapter.busquedaPorCoincidenciaParcial('trigo');

      expect(result).toEqual({ data: [], total: 0 });
    });

    it('returns an empty result for empty or whitespace terms', async () => {
      await expect(
        adapter.busquedaPorCoincidenciaParcial(''),
      ).resolves.toEqual({ data: [], total: 0 });
      await expect(
        adapter.busquedaPorCoincidenciaParcial('   '),
      ).resolves.toEqual({ data: [], total: 0 });
    });

    it('excludes soft-deleted products', async () => {
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

    it('paginates ten rows at a time while reporting the full total', async () => {
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
    it('returns products from at least two lineas that belong to the superlinea', async () => {
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

    it('excludes soft-deleted producto, linea and superlinea', async () => {
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

    it('paginates the superlinea join ten rows at a time while reporting the full total', async () => {
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

    it('returns an empty result for an unknown superlinea id', async () => {
      await expect(
        adapter.findProductosBySuperLinea(999999),
      ).resolves.toEqual({ data: [], total: 0 });
    });
  });
});

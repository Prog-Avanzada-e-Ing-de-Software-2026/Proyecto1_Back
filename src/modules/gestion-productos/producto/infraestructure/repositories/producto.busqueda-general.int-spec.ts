import { DataSource } from 'typeorm';
import {
  createInitializedTestDataSource,
  createUnitOfWorkStub,
  truncateTables,
} from '../../../../../../test/integration/test-datasource';
import { CambioPrecio } from '../../domain/entities/cambio-precio.entity';
import { Producto } from '../../domain/entities/producto.entity';
import { ProductoPersistenceAdapter } from './producto.persistence-adapters';

/**
 * Búsqueda general de productos contra MySQL real: CP-94 a CP-97.
 *
 * Ejercita `ProductoPersistenceAdapter.findBy` (lo que expone
 * `/api/producto/search-by`) y `findByRapido` (`/api/producto/search-by-rapido`).
 *
 * CP-96 y CP-97 (el modo exacto de `search-by`) documentan defectos reales: sus
 * aserciones describen el comportamiento prometido por el contrato y se esperan
 * en rojo hasta que la aplicación lo cumpla. No se debilitan para que pasen.
 */
describe('ProductoPersistenceAdapter - Búsqueda general de productos', () => {
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
    presentacionId = await createPresentacion('Presentacion busqueda general');
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

  async function createSuperLinea(denominacion: string): Promise<number> {
    const result = await dataSource.query(
      'INSERT INTO `super_linea` (`denominacion`) VALUES (?)',
      [denominacion],
    );
    return result.insertId as number;
  }

  async function createLinea(
    denominacion: string,
    superLineaId: number,
  ): Promise<number> {
    const result = await dataSource.query(
      'INSERT INTO `linea` (`denominacion`, `super_linea_id`) VALUES (?, ?)',
      [denominacion, superLineaId],
    );
    return result.insertId as number;
  }

  async function createMarca(denominacion: string): Promise<number> {
    const result = await dataSource.query(
      'INSERT INTO `marca` (`denominacion`) VALUES (?)',
      [denominacion],
    );
    return result.insertId as number;
  }

  interface ProductoFixture {
    denominacion: string;
    lineaId?: number | null;
    marcaId?: number | null;
    proveedorId?: number | null;
    stock?: number;
    codigoReferencia?: string | null;
    deletedAt?: Date | null;
  }

  async function createProducto(fixture: ProductoFixture): Promise<number> {
    const result = await dataSource.query(
      'INSERT INTO `producto` (`denominacion`, `linea_id`, `marca_id`, `presentacion_id`, `proveedor_id`, `stock`, `codigoReferencia`, `deletedAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        fixture.denominacion,
        fixture.lineaId ?? null,
        fixture.marcaId ?? null,
        presentacionId,
        fixture.proveedorId ?? null,
        fixture.stock ?? 0,
        fixture.codigoReferencia ?? null,
        fixture.deletedAt ?? null,
      ],
    );
    return result.insertId as number;
  }

  describe('findBy - búsqueda general', () => {
    it('CP-94 - Combinar los filtros de la búsqueda general', async () => {
      // Given productos activos de distintas marcas y líneas, con y sin stock.
      const superLineaId = await createSuperLinea('Bebidas');
      const lineaAguasId = await createLinea('AGUAS', superLineaId);
      const lineaGaseosasId = await createLinea('GASEOSAS', superLineaId);
      const marcaNuestraId = await createMarca('NUESTRA');
      const marcaOtraId = await createMarca('OTRA');

      // Marca "NUESTRA" + línea "AGUAS" + stock > 0: son las coincidencias.
      await createProducto({
        denominacion: 'Agua mineral',
        marcaId: marcaNuestraId,
        lineaId: lineaAguasId,
        stock: 5,
      });
      await createProducto({
        denominacion: 'Agua con gas',
        marcaId: marcaNuestraId,
        lineaId: lineaAguasId,
        stock: 3,
      });
      // Misma marca y línea, pero sin stock.
      await createProducto({
        denominacion: 'Agua sin stock',
        marcaId: marcaNuestraId,
        lineaId: lineaAguasId,
        stock: 0,
      });
      // Misma marca, otra línea, con stock.
      await createProducto({
        denominacion: 'Gaseosa cola',
        marcaId: marcaNuestraId,
        lineaId: lineaGaseosasId,
        stock: 7,
      });
      // Otra marca, misma línea, con stock.
      await createProducto({
        denominacion: 'Agua de otra marca',
        marcaId: marcaOtraId,
        lineaId: lineaAguasId,
        stock: 9,
      });

      // When se busca indicando la marca "NUESTRA", la línea "AGUAS" y que se
      // requiera stock.
      const paginaCompleta = await adapter.findBy(
        '',
        '',
        false,
        '',
        marcaNuestraId,
        lineaAguasId,
        0,
        true,
        0,
        10,
      );
      const primeraPagina = await adapter.findBy(
        '',
        '',
        false,
        '',
        marcaNuestraId,
        lineaAguasId,
        0,
        true,
        0,
        1,
      );

      // Then se devuelven solo los productos activos de esa marca y esa línea
      // con stock mayor a 0...
      const denominaciones = paginaCompleta.data.map(
        (producto) => producto.denominacion,
      );
      expect(paginaCompleta.total).toBe(2);
      expect(denominaciones).toEqual(['Agua con gas', 'Agua mineral']);
      // ...y no se devuelven los productos de otras marcas ni de otras líneas.
      expect(denominaciones).not.toContain('Agua sin stock');
      expect(denominaciones).not.toContain('Gaseosa cola');
      expect(denominaciones).not.toContain('Agua de otra marca');
      // And la respuesta viene paginada.
      expect(primeraPagina.data).toHaveLength(1);
      expect(primeraPagina.total).toBe(2);
    });

    it('CP-95 - La búsqueda general solo devuelve productos activos', async () => {
      // Given un producto activo y un producto eliminado lógicamente que
      // cumplen el filtro.
      const superLineaId = await createSuperLinea('Bebidas');
      const lineaId = await createLinea('AGUAS', superLineaId);
      const marcaId = await createMarca('NUESTRA');
      await createProducto({
        denominacion: 'Agua activa',
        marcaId,
        lineaId,
        stock: 5,
      });
      await createProducto({
        denominacion: 'Agua eliminada',
        marcaId,
        lineaId,
        stock: 5,
        deletedAt: new Date(),
      });

      // When se busca con ese filtro.
      const result = await adapter.findBy(
        '',
        '',
        false,
        '',
        marcaId,
        lineaId,
        0,
        false,
        0,
        10,
      );

      // Then se devuelve el producto activo...
      expect(result.total).toBe(1);
      expect(result.data.map((producto) => producto.denominacion)).toEqual([
        'Agua activa',
      ]);
      // ...y no se devuelve el producto eliminado.
      expect(result.data.map((producto) => producto.denominacion)).not.toContain(
        'Agua eliminada',
      );
    });

    it('CP-96 - Traer todos los productos sin indicar filtros', async () => {
      // Given productos activos cargados en el catálogo, y uno eliminado.
      const superLineaId = await createSuperLinea('Bebidas');
      const lineaId = await createLinea('AGUAS', superLineaId);
      const marcaId = await createMarca('NUESTRA');
      await createProducto({
        denominacion: 'Agua 01',
        marcaId,
        lineaId,
        stock: 5,
      });
      await createProducto({
        denominacion: 'Agua 02',
        marcaId,
        lineaId,
        stock: 0,
      });
      await createProducto({
        denominacion: 'Agua borrada',
        marcaId,
        lineaId,
        stock: 5,
        deletedAt: new Date(),
      });

      // When se busca sin indicar ningún filtro.
      const result = await adapter.findBy('', '', false, '', 0, 0, 0, false, 0, 10);

      // Then se devuelven todos los productos activos...
      const denominaciones = result.data
        .map((producto) => producto.denominacion)
        .sort();
      expect(result.total).toBe(2);
      expect(denominaciones).toEqual(['Agua 01', 'Agua 02']);
      // ...y no los eliminados lógicamente.
      expect(denominaciones).not.toContain('Agua borrada');
    });

    it('CP-97 - El modo exacto de búsqueda por código de referencia debe respetarse', async () => {
      // Given existe un producto con código de referencia "1234"...
      await createProducto({
        denominacion: 'Producto codigo corto',
        codigoReferencia: '1234',
      });
      // ...y existe un producto con código de referencia "12345".
      await createProducto({
        denominacion: 'Producto codigo largo',
        codigoReferencia: '12345',
      });

      // When se busca por código de referencia en modo exacto con "1234".
      const exacto = await adapter.findByRapido('1234', true, 0, 10);

      // Then se devuelve solo el producto con código "1234"...
      expect(exacto.total).toBe(1);
      expect(exacto.data.map((producto) => producto.codigoReferencia)).toEqual([
        '1234',
      ]);
      // ...y no se devuelve el producto con código "12345".
      expect(
        exacto.data.map((producto) => producto.codigoReferencia),
      ).not.toContain('12345');

      // When se busca por código de referencia en modo parcial con "1234".
      const parcial = await adapter.findByRapido('1234', false, 0, 10);

      // Then se devuelven ambos productos.
      expect(parcial.total).toBe(2);
      expect(
        parcial.data
          .map((producto) => producto.codigoReferencia)
          .sort((a, b) => String(a).localeCompare(String(b))),
      ).toEqual(['1234', '12345']);
    });
  });
});

import { DataSource, QueryFailedError } from 'typeorm';
import type { StartedMySqlContainer } from '@testcontainers/mysql';
import {
  createInitializedTestDataSource,
  createUnitOfWorkStub,
  truncateTables,
} from '../../../../../../test/integration/test-datasource';
import { startMySqlTestContainer } from '../../../../../../test/integration/mysql-test-container';
import { Linea } from '../../domain/entities/linea.entity';
import { LineaPersistenceAdapter } from './linea.persistence-adapter';
import { SuperLinea } from '../../../superlinea/domain/entities/superlinea.entity';
import { DatabaseConnectionException } from 'src/modules/common/exceptions/database-connection.exception';
import { Producto } from '../../../producto/domain/entities/producto.entity';
import { CambioPrecio } from '../../../producto/domain/entities/cambio-precio.entity';
import { ProductoPersistenceAdapter } from '../../../producto/infraestructure/repositories/producto.persistence-adapters';

describe('LineaPersistenceAdapter - persistencia y búsqueda por coincidencia parcial', () => {
  let container: StartedMySqlContainer;
  let dataSource: DataSource;
  let adapter: LineaPersistenceAdapter;
  let superLineaId: number;

  beforeAll(async () => {
    container = await startMySqlTestContainer();
    dataSource = await createInitializedTestDataSource(container);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (container) await container.stop();
  });

  beforeEach(async () => {
    await truncateTables(dataSource);
    adapter = new LineaPersistenceAdapter(
      dataSource.getRepository(Linea),
      dataSource,
      createUnitOfWorkStub(dataSource),
    );
    superLineaId = await createSuperLinea('Super linea de prueba');
  });

  async function createSuperLinea(denominacion: string): Promise<number> {
    const result = await dataSource.query(
      'INSERT INTO `super_linea` (`denominacion`) VALUES (?)',
      [denominacion],
    );
    return result.insertId as number;
  }

  async function createPresentacion(denominacion: string): Promise<number> {
    const result = await dataSource.query(
      'INSERT INTO `presentacion` (`denominacion`) VALUES (?)',
      [denominacion],
    );
    return result.insertId as number;
  }

  async function createProducto(
    denominacion: string,
    lineaId: number,
    presentacionId: number,
    deletedAt: Date | null = null,
  ): Promise<number> {
    const result = await dataSource.query(
      'INSERT INTO `producto` (`denominacion`, `linea_id`, `presentacion_id`, `deletedAt`) VALUES (?, ?, ?, ?)',
      [denominacion, lineaId, presentacionId, deletedAt],
    );
    return result.insertId as number;
  }

  it('CP-47/CP-54 - Persiste una única asociación con una SuperLínea activa y carga su detalle', async () => {
    const superLinea = await dataSource.getRepository(SuperLinea).findOneByOrFail({
      id: superLineaId,
    });

    const created = await adapter.create(
      {
        denominacion: 'Sin Alcohol',
        utilizaStockMinimo: false,
        usuarioCreatedId: 7,
        superLineaId,
        deletedAt: null,
      },
      superLinea,
    );
    const detail = await adapter.findOne(created.id);

    expect(detail).toEqual(
      expect.objectContaining({
        id: created.id,
        denominacion: 'Sin Alcohol',
        superLineaId,
        superLinea: expect.objectContaining({
          id: superLineaId,
          denominacion: 'Super linea de prueba',
        }),
      }),
    );
  });

  it('CP-50/CP-51 - Reasigna únicamente cuando se provee una nueva SuperLínea', async () => {
    const original = await dataSource.getRepository(SuperLinea).findOneByOrFail({
      id: superLineaId,
    });
    const created = await adapter.create(
      {
        denominacion: 'Sin Alcohol',
        utilizaStockMinimo: false,
        usuarioCreatedId: 7,
        superLineaId,
        deletedAt: null,
      },
      original,
    );
    const otherId = await createSuperLinea('Hogar');
    const other = await dataSource.getRepository(SuperLinea).findOneByOrFail({ id: otherId });

    await adapter.update(created.id, { observacion: 'Updated', usuarioUpdatedId: 8 });
    expect((await adapter.findOne(created.id))?.superLineaId).toBe(superLineaId);

    await adapter.update(
      created.id,
      { superLineaId: otherId, usuarioUpdatedId: 8 },
      other,
    );
    expect((await adapter.findOne(created.id))?.superLineaId).toBe(otherId);
  });

  it('CP-55 - Elimina lógicamente una Línea sin borrar su registro', async () => {
    const id = await createLinea('Sin Alcohol');
    const current = await adapter.findOne(id);

    await adapter.remove(current!, { id: 9 } as never);

    await expect(adapter.findOne(id)).rejects.toBeDefined();
    const persisted = await dataSource.getRepository(Linea).findOne({
      where: { id },
      withDeleted: true,
    });
    expect(persisted?.deletedAt).toBeInstanceOf(Date);
    expect(persisted?.usuarioDeletedId).toBe(9);
  });

  it('CP-56 - Detecta Productos activos asociados a una Línea', async () => {
    const lineaId = await createLinea('Con productos');
    const presentacionId = await createPresentacion('Caja');
    await createProducto('Producto activo', lineaId, presentacionId);

    const productoAdapter = new ProductoPersistenceAdapter(
      dataSource.getRepository(Producto),
      dataSource.getRepository(CambioPrecio),
      dataSource,
      createUnitOfWorkStub(dataSource),
    );

    expect(await productoAdapter.existsProductosActivosByLinea(lineaId)).toBe(true);

    await dataSource.query(
      'UPDATE `producto` SET `deletedAt` = NOW() WHERE `linea_id` = ?',
      [lineaId],
    );
    expect(await productoAdapter.existsProductosActivosByLinea(lineaId)).toBe(false);
  });

  it('CP-64/CP-65 - Detecta únicamente Líneas activas asociadas a una SuperLínea', async () => {
    const id = await createLinea('Activa');

    await expect(adapter.existsActiveBySuperLinea(superLineaId)).resolves.toBe(true);

    await dataSource.query('UPDATE `linea` SET `deletedAt` = NOW() WHERE `id` = ?', [id]);
    await expect(adapter.existsActiveBySuperLinea(superLineaId)).resolves.toBe(false);
  });

  it('CP-48 - La base de datos rechaza una Línea asociada a una SuperLínea inexistente', async () => {
    const missingSuperLinea = Object.assign(new SuperLinea(), { id: 99_999 });

    await expect(
      adapter.create(
        {
          denominacion: 'Sin SuperLínea',
          utilizaStockMinimo: false,
          usuarioCreatedId: 7,
          superLineaId: 99_999,
          deletedAt: null,
        },
        missingSuperLinea,
      ),
    ).rejects.toThrow(DatabaseConnectionException);
  });

  it('CP-49 - Acepta una denominación de 255 caracteres y rechaza una de 256', async () => {
    const superLinea = await dataSource.getRepository(SuperLinea).findOneByOrFail({
      id: superLineaId,
    });

    const valid = await adapter.create(
      {
        denominacion: 'a'.repeat(255),
        utilizaStockMinimo: false,
        usuarioCreatedId: 7,
        superLineaId,
        deletedAt: null,
      },
      superLinea,
    );
    expect(valid.denominacion).toBe('a'.repeat(255));

    await expect(
      adapter.create(
        {
          denominacion: 'a'.repeat(256),
          utilizaStockMinimo: false,
          usuarioCreatedId: 7,
          superLineaId,
          deletedAt: null,
        },
        superLinea,
      ),
    ).rejects.toThrow(DatabaseConnectionException);
  });

  it('CP-49 - findByDenominacionWith devuelve una Línea eliminada lógicamente como reservada', async () => {
    const id = await createLinea('Reservada');
    await dataSource.query('UPDATE `linea` SET `deletedAt` = NOW() WHERE `id` = ?', [id]);

    const existing = await adapter.findByDenominacionWith('reservada');

    expect(existing).toEqual(expect.objectContaining({ id, denominacion: 'Reservada' }));
  });

  it('CP-52 - La base de datos rechaza la reasignación a una SuperLínea inexistente', async () => {
    const superLinea = await dataSource.getRepository(SuperLinea).findOneByOrFail({
      id: superLineaId,
    });
    const created = await adapter.create(
      {
        denominacion: 'Sin Alcohol',
        utilizaStockMinimo: false,
        usuarioCreatedId: 7,
        superLineaId,
        deletedAt: null,
      },
      superLinea,
    );
    const missingSuperLinea = Object.assign(new SuperLinea(), { id: 99_999 });

    await expect(
      adapter.update(
        created.id,
        { superLineaId: 99_999, usuarioUpdatedId: 8 },
        missingSuperLinea,
      ),
    ).rejects.toThrow(QueryFailedError);
  });

  it('CP-53 - findByDenominacionWith detecta otra Línea activa con la misma denominación', async () => {
    await createLinea('Reservada');

    // The schema uses (denominacion, deletedAt) with a nullable deletedAt, so
    // MySQL does not enforce uniqueness among active rows at the database
    // level. The application-level rejection relies on this query finding the
    // existing active row before the update is attempted.
    const existing = await adapter.findByDenominacionWith('reservada');

    expect(existing).toEqual(
      expect.objectContaining({ denominacion: 'Reservada', deletedAt: null }),
    );
  });

  async function createLinea(
    denominacion: string,
    observacion: string | null = null,
    deletedAt: Date | null = null,
  ): Promise<number> {
    const result = await dataSource.query(
      'INSERT INTO `linea` (`denominacion`, `observacion`, `super_linea_id`, `deletedAt`) VALUES (?, ?, ?, ?)',
      [denominacion, observacion, superLineaId, deletedAt],
    );
    return result.insertId as number;
  }

  it('No-CP - La selección de líneas no distingue mayúsculas de minúsculas', async () => {
    const firstId = await createLinea('Alfa harina', 'obs A');
    await createLinea('HARINA mayus', 'obs B');

    const result = await adapter.busquedaPorCoincidenciaParcial('harina');

    expect(result).toHaveLength(2);
    for (const linea of result) {
      expect(linea).toBeInstanceOf(Linea);
    }
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: firstId,
          denominacion: 'Alfa harina',
          observacion: 'obs A',
        }),
      ]),
    );
  });

  it('No-CP - Buscar "harina" no devuelve "harína"', async () => {
    await createLinea('harína acento');
    await createLinea('Alfa harina');

    const result = await adapter.busquedaPorCoincidenciaParcial('harina');

    expect(result.map((linea) => linea.denominacion)).toEqual(['Alfa harina']);
  });

  it('No-CP - Un término con tilde solo coincide con denominaciones con tilde', async () => {
    await createLinea('harína premium');
    await createLinea('Alfa harina');

    const result = await adapter.busquedaPorCoincidenciaParcial('harína');

    expect(result.map((linea) => linea.denominacion)).toEqual([
      'harína premium',
    ]);
  });

  it('No-CP - Un término sin coincidencias devuelve una colección vacía', async () => {
    await createLinea('Arroz');

    const result = await adapter.busquedaPorCoincidenciaParcial('trigo');

    expect(result).toEqual([]);
  });

  it('No-CP - Un término vacío o de solo espacios devuelve una colección vacía', async () => {
    await expect(adapter.busquedaPorCoincidenciaParcial('')).resolves.toEqual([]);
    await expect(adapter.busquedaPorCoincidenciaParcial('   ')).resolves.toEqual([]);
  });

  it('No-CP - Solo se ofrecen líneas activas (excluye las eliminadas lógicamente)', async () => {
    await createLinea('Alfa harina');
    await createLinea('Beta harina', null, new Date());

    const result = await adapter.busquedaPorCoincidenciaParcial('harina');

    expect(result.map((linea) => linea.denominacion)).toEqual(['Alfa harina']);
  });

  it('No-CP - Los resultados vienen ordenados ascendentemente por denominación', async () => {
    await createLinea('Gamma harina');
    await createLinea('Alfa harina');
    await createLinea('Beta harina');

    const result = await adapter.busquedaPorCoincidenciaParcial('harina');

    expect(result.map((linea) => linea.denominacion)).toEqual([
      'Alfa harina',
      'Beta harina',
      'Gamma harina',
    ]);
  });
});

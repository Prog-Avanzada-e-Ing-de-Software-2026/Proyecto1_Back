import { DataSource } from 'typeorm';
import {
  createInitializedTestDataSource,
  createUnitOfWorkStub,
  truncateTables,
} from '../../../../../../test/integration/test-datasource';
import { Linea } from '../../domain/entities/linea.entity';
import { LineaPersistenceAdapter } from './linea.persistence-adapter';

describe('LineaPersistenceAdapter - CR-004 partial coincidence search', () => {
  let dataSource: DataSource;
  let adapter: LineaPersistenceAdapter;
  let superLineaId: number;

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

  it('returns matching entities and matches case-insensitively', async () => {
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

  it('is accent-sensitive', async () => {
    await createLinea('harína acento');
    await createLinea('Alfa harina');

    const result = await adapter.busquedaPorCoincidenciaParcial('harina');

    expect(result.map((linea) => linea.denominacion)).toEqual(['Alfa harina']);
  });

  it('matches an accented term against an accented denominación only', async () => {
    await createLinea('harína premium');
    await createLinea('Alfa harina');

    const result = await adapter.busquedaPorCoincidenciaParcial('harína');

    expect(result.map((linea) => linea.denominacion)).toEqual([
      'harína premium',
    ]);
  });

  it('returns an empty array when the term is not contained in any denominación', async () => {
    await createLinea('Arroz');

    const result = await adapter.busquedaPorCoincidenciaParcial('trigo');

    expect(result).toEqual([]);
  });

  it('returns an empty array for an empty or whitespace term', async () => {
    await expect(adapter.busquedaPorCoincidenciaParcial('')).resolves.toEqual([]);
    await expect(adapter.busquedaPorCoincidenciaParcial('   ')).resolves.toEqual([]);
  });

  it('excludes soft-deleted lineas', async () => {
    await createLinea('Alfa harina');
    await createLinea('Beta harina', null, new Date());

    const result = await adapter.busquedaPorCoincidenciaParcial('harina');

    expect(result.map((linea) => linea.denominacion)).toEqual(['Alfa harina']);
  });

  it('orders results ascending by denominacion', async () => {
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

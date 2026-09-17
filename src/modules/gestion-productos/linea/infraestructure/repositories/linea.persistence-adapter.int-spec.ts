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

  it('CP-84 - La selección de líneas no distingue mayúsculas de minúsculas', async () => {
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

  it('CP-83 - Buscar "harina" no devuelve "harína"', async () => {
    await createLinea('harína acento');
    await createLinea('Alfa harina');

    const result = await adapter.busquedaPorCoincidenciaParcial('harina');

    expect(result.map((linea) => linea.denominacion)).toEqual(['Alfa harina']);
  });

  it('CP-83 - Un término con tilde solo coincide con denominaciones con tilde', async () => {
    await createLinea('harína premium');
    await createLinea('Alfa harina');

    const result = await adapter.busquedaPorCoincidenciaParcial('harína');

    expect(result.map((linea) => linea.denominacion)).toEqual([
      'harína premium',
    ]);
  });

  it('CP-68 - Un término sin coincidencias devuelve una colección vacía', async () => {
    await createLinea('Arroz');

    const result = await adapter.busquedaPorCoincidenciaParcial('trigo');

    expect(result).toEqual([]);
  });

  it('CP-72 - Un término vacío o de solo espacios devuelve una colección vacía', async () => {
    await expect(adapter.busquedaPorCoincidenciaParcial('')).resolves.toEqual([]);
    await expect(adapter.busquedaPorCoincidenciaParcial('   ')).resolves.toEqual([]);
  });

  it('CP-85 - Solo se ofrecen líneas activas (excluye las eliminadas lógicamente)', async () => {
    await createLinea('Alfa harina');
    await createLinea('Beta harina', null, new Date());

    const result = await adapter.busquedaPorCoincidenciaParcial('harina');

    expect(result.map((linea) => linea.denominacion)).toEqual(['Alfa harina']);
  });

  it('CP-82 - Los resultados vienen ordenados ascendentemente por denominación', async () => {
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

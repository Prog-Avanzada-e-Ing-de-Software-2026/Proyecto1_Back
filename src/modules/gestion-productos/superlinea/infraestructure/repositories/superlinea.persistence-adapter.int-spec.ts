import { DataSource } from 'typeorm';
import { SelectOption } from 'src/modules/common/interface/select-option';
import {
  createInitializedTestDataSource,
  createUnitOfWorkStub,
  truncateTables,
} from '../../../../../../test/integration/test-datasource';
import { SuperLinea } from '../../domain/entities/superlinea.entity';
import { SuperLineaPersistenceAdapter } from './superlinea.persistence-adapter';

describe('SuperLineaPersistenceAdapter - CR-004 partial coincidence search', () => {
  let dataSource: DataSource;
  let adapter: SuperLineaPersistenceAdapter;

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
    adapter = new SuperLineaPersistenceAdapter(
      dataSource.getRepository(SuperLinea),
      dataSource,
      createUnitOfWorkStub(dataSource),
    );
  });

  async function createSuperLinea(
    denominacion: string,
    observacion: string | null = null,
    deletedAt: Date | null = null,
  ): Promise<number> {
    const result = await dataSource.query(
      'INSERT INTO `super_linea` (`denominacion`, `observacion`, `deletedAt`) VALUES (?, ?, ?)',
      [denominacion, observacion, deletedAt],
    );
    return result.insertId as number;
  }

  it('returns the slim SelectOption shape and matches case-insensitively', async () => {
    const firstId = await createSuperLinea('Alfa linea', 'obs A');
    await createSuperLinea('LINEA mayus', 'obs B');

    const result = await adapter.busquedaPorCoincidenciaParcial('linea');

    expect(result).toHaveLength(2);
    for (const option of result) {
      expect(Object.keys(option).sort()).toEqual([
        'codigo',
        'descripcion',
        'nombre',
      ]);
    }
    const expected: SelectOption = {
      codigo: firstId,
      nombre: 'Alfa linea',
      descripcion: 'obs A',
    };
    expect(result).toContainEqual(expected);
  });

  it('is accent-sensitive', async () => {
    await createSuperLinea('línea acento');
    await createSuperLinea('Alfa linea');

    const result = await adapter.busquedaPorCoincidenciaParcial('linea');

    expect(result.map((option) => option.nombre)).toEqual(['Alfa linea']);
  });

  it('matches an accented term against an accented denominación only', async () => {
    await createSuperLinea('línea premium');
    await createSuperLinea('Alfa linea');

    const result = await adapter.busquedaPorCoincidenciaParcial('línea');

    expect(result.map((option) => option.nombre)).toEqual(['línea premium']);
  });

  it('returns an empty array when the term is not contained in any denominación', async () => {
    await createSuperLinea('Arroz');

    const result = await adapter.busquedaPorCoincidenciaParcial('trigo');

    expect(result).toEqual([]);
  });

  it('returns an empty array for an empty or whitespace term', async () => {
    await expect(adapter.busquedaPorCoincidenciaParcial('')).resolves.toEqual([]);
    await expect(adapter.busquedaPorCoincidenciaParcial('   ')).resolves.toEqual([]);
  });

  it('excludes soft-deleted super lineas', async () => {
    await createSuperLinea('Alfa linea');
    await createSuperLinea('Beta linea', null, new Date());

    const result = await adapter.busquedaPorCoincidenciaParcial('linea');

    expect(result.map((option) => option.nombre)).toEqual(['Alfa linea']);
  });

  it('orders results ascending by denominacion', async () => {
    await createSuperLinea('Gamma linea');
    await createSuperLinea('Alfa linea');
    await createSuperLinea('Beta linea');

    const result = await adapter.busquedaPorCoincidenciaParcial('linea');

    expect(result.map((option) => option.nombre)).toEqual([
      'Alfa linea',
      'Beta linea',
      'Gamma linea',
    ]);
  });
});

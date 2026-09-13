import { DataSource } from 'typeorm';
import { SelectOption } from 'src/modules/common/interface/select-option';
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

  it('returns the slim SelectOption shape and matches case-insensitively', async () => {
    const firstId = await createLinea('Alfa harina', 'obs A');
    await createLinea('HARINA mayus', 'obs B');

    const result = await adapter.busquedaPorCoincidenciaParcial('harina');

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
      nombre: 'Alfa harina',
      descripcion: 'obs A',
    };
    expect(result).toContainEqual(expected);
  });

  it('is accent-sensitive', async () => {
    await createLinea('harína acento');
    await createLinea('Alfa harina');

    const result = await adapter.busquedaPorCoincidenciaParcial('harina');

    expect(result.map((option) => option.nombre)).toEqual(['Alfa harina']);
  });

  it('returns an empty array for an empty or whitespace term', async () => {
    await expect(adapter.busquedaPorCoincidenciaParcial('')).resolves.toEqual([]);
    await expect(adapter.busquedaPorCoincidenciaParcial('   ')).resolves.toEqual([]);
  });

  it('excludes soft-deleted lineas', async () => {
    await createLinea('Alfa harina');
    await createLinea('Beta harina', null, new Date());

    const result = await adapter.busquedaPorCoincidenciaParcial('harina');

    expect(result.map((option) => option.nombre)).toEqual(['Alfa harina']);
  });

  it('orders results ascending by denominacion', async () => {
    await createLinea('Gamma harina');
    await createLinea('Alfa harina');
    await createLinea('Beta harina');

    const result = await adapter.busquedaPorCoincidenciaParcial('harina');

    expect(result.map((option) => option.nombre)).toEqual([
      'Alfa harina',
      'Beta harina',
      'Gamma harina',
    ]);
  });
});

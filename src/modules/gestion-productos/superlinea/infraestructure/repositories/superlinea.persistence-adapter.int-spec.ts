import { DataSource } from 'typeorm';
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

  it('CP-87 - Seleccionar superlíneas por coincidencia parcial sin distinguir mayúsculas', async () => {
    const firstId = await createSuperLinea('Alfa linea', 'obs A');
    await createSuperLinea('LINEA mayus', 'obs B');

    const result = await adapter.busquedaPorCoincidenciaParcial('linea');

    expect(result).toHaveLength(2);
    for (const superLinea of result) {
      expect(superLinea).toBeInstanceOf(SuperLinea);
    }
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: firstId,
          denominacion: 'Alfa linea',
          observacion: 'obs A',
        }),
      ]),
    );
  });

  it('CP-87 - Buscar "linea" no devuelve "línea"', async () => {
    await createSuperLinea('línea acento');
    await createSuperLinea('Alfa linea');

    const result = await adapter.busquedaPorCoincidenciaParcial('linea');

    expect(result.map((superLinea) => superLinea.denominacion)).toEqual([
      'Alfa linea',
    ]);
  });

  it('CP-87 - Un término con tilde solo coincide con denominaciones con tilde', async () => {
    await createSuperLinea('línea premium');
    await createSuperLinea('Alfa linea');

    const result = await adapter.busquedaPorCoincidenciaParcial('línea');

    expect(result.map((superLinea) => superLinea.denominacion)).toEqual([
      'línea premium',
    ]);
  });

  it('CP-68 - Un término sin coincidencias devuelve una colección vacía', async () => {
    await createSuperLinea('Arroz');

    const result = await adapter.busquedaPorCoincidenciaParcial('trigo');

    expect(result).toEqual([]);
  });

  it('CP-72 - Un término vacío o de solo espacios devuelve una colección vacía', async () => {
    await expect(adapter.busquedaPorCoincidenciaParcial('')).resolves.toEqual([]);
    await expect(adapter.busquedaPorCoincidenciaParcial('   ')).resolves.toEqual([]);
  });

  it('CP-87 - Solo se ofrecen superlíneas activas (excluye las eliminadas lógicamente)', async () => {
    await createSuperLinea('Alfa linea');
    await createSuperLinea('Beta linea', null, new Date());

    const result = await adapter.busquedaPorCoincidenciaParcial('linea');

    expect(result.map((superLinea) => superLinea.denominacion)).toEqual([
      'Alfa linea',
    ]);
  });
});

import { DataSource } from 'typeorm';
import type { StartedMySqlContainer } from '@testcontainers/mysql';
import {
  createInitializedTestDataSource,
  createUnitOfWorkStub,
  truncateTables,
} from '../../../../../../test/integration/test-datasource';
import { startMySqlTestContainer } from '../../../../../../test/integration/mysql-test-container';
import { SuperLinea } from '../../domain/entities/superlinea.entity';
import { SuperLineaPersistenceAdapter } from './superlinea.persistence-adapter';

describe('SuperLineaPersistenceAdapter - persistencia y búsqueda por coincidencia parcial', () => {
  let container: StartedMySqlContainer;
  let dataSource: DataSource;
  let adapter: SuperLineaPersistenceAdapter;

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

  it('CP-57 - Registra una SuperLínea válida con o sin observación opcional', async () => {
    const withoutObservation = await adapter.create({
      denominacion: 'Bebidas',
      usuarioCreatedId: 7,
    });
    expect(withoutObservation).toEqual(
      expect.objectContaining({ id: expect.any(Number), denominacion: 'Bebidas' }),
    );

    const withObservation = await adapter.create({
      denominacion: 'Hogar',
      observacion: 'Observación opcional',
      usuarioCreatedId: 7,
    });
    expect(withObservation).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        denominacion: 'Hogar',
        observacion: 'Observación opcional',
      }),
    );
  });

  it.each(['maquinas', 'MÁQUINAS'])(
    'CP-59 - Trata la variante de mayúsculas y tildes %s como una denominación reservada',
    async (candidate) => {
      await createSuperLinea('Máquinas', null, new Date());

      const existing = await adapter.findByDenominacionWithDeleted(candidate);

      expect(existing).toEqual(expect.objectContaining({ denominacion: 'Máquinas' }));
    },
  );

  it('CP-60/CP-61 - Lista únicamente los registros activos e informa el total real', async () => {
    await createSuperLinea('Bebidas', 'Con observación');
    await createSuperLinea('Hogar');
    await createSuperLinea('Eliminada', null, new Date());

    const populated = await adapter.findBy({
      denominacion: '',
      skip: 0,
      take: 10,
      incluirEliminados: false,
    });
    expect(populated.total).toBe(2);
    expect(populated.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ denominacion: 'Bebidas', observacion: 'Con observación' }),
        expect.objectContaining({ denominacion: 'Hogar' }),
      ]),
    );

    await truncateTables(dataSource);
    await expect(
      adapter.findBy({ denominacion: '', skip: 0, take: 10, incluirEliminados: false }),
    ).resolves.toEqual({ data: [], total: 0 });
  });

  it('CP-62 - Persiste una modificación conservando el identificador', async () => {
    const id = await createSuperLinea('Bebidas');

    const updated = await adapter.update(id, {
      denominacion: 'Bebidas Sin Alcohol',
      observacion: 'Updated',
      usuarioUpdatedId: 8,
    });

    expect(updated).toEqual(
      expect.objectContaining({
        id,
        denominacion: 'Bebidas Sin Alcohol',
        observacion: 'Updated',
      }),
    );
  });

  it('CP-63 - La modificación de la propia denominación no debe detectar el registro actual como conflicto (pendiente de corrección en producción)', async () => {
    await createSuperLinea('Bebidas');

    // The persistence query used by the uniqueness policy does not exclude the
    // current entity, so a service-level self-update is wrongly treated as a
    // conflict. This assertion documents the gap and must stay RED until
    // production passes the current ID to the policy.
    const existing = await adapter.findByDenominacionWithDeleted('bebidas');

    expect(existing).toBeNull();
  });

  it('CP-64/CP-66 - Elimina lógicamente una SuperLínea y la excluye del detalle', async () => {
    const id = await createSuperLinea('Bebidas');
    const current = await adapter.findOne(id);

    await adapter.remove(current!, { id: 9 } as never);

    await expect(adapter.findOne(id)).resolves.toBeNull();
    const persisted = await dataSource.getRepository(SuperLinea).findOne({
      where: { id },
      withDeleted: true,
    });
    expect(persisted?.deletedAt).toBeInstanceOf(Date);
    expect(persisted?.usuarioDeletedId).toBe(9);
  });

  it('No-CP - Seleccionar superlíneas por coincidencia parcial sin distinguir mayúsculas', async () => {
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

  it('No-CP - Buscar "linea" no devuelve "línea"', async () => {
    await createSuperLinea('línea acento');
    await createSuperLinea('Alfa linea');

    const result = await adapter.busquedaPorCoincidenciaParcial('linea');

    expect(result.map((superLinea) => superLinea.denominacion)).toEqual([
      'Alfa linea',
    ]);
  });

  it('No-CP - Un término con tilde solo coincide con denominaciones con tilde', async () => {
    await createSuperLinea('línea premium');
    await createSuperLinea('Alfa linea');

    const result = await adapter.busquedaPorCoincidenciaParcial('línea');

    expect(result.map((superLinea) => superLinea.denominacion)).toEqual([
      'línea premium',
    ]);
  });

  it('No-CP - Un término sin coincidencias devuelve una colección vacía', async () => {
    await createSuperLinea('Arroz');

    const result = await adapter.busquedaPorCoincidenciaParcial('trigo');

    expect(result).toEqual([]);
  });

  it('No-CP - Un término vacío o de solo espacios devuelve una colección vacía', async () => {
    await expect(adapter.busquedaPorCoincidenciaParcial('')).resolves.toEqual([]);
    await expect(adapter.busquedaPorCoincidenciaParcial('   ')).resolves.toEqual([]);
  });

  it('No-CP - Solo se ofrecen superlíneas activas (excluye las eliminadas lógicamente)', async () => {
    await createSuperLinea('Alfa linea');
    await createSuperLinea('Beta linea', null, new Date());

    const result = await adapter.busquedaPorCoincidenciaParcial('linea');

    expect(result.map((superLinea) => superLinea.denominacion)).toEqual([
      'Alfa linea',
    ]);
  });
});

import { DataSource } from 'typeorm';
import type { StartedMySqlContainer } from '@testcontainers/mysql';
import {
  createInitializedTestDataSource,
  createUnitOfWorkStub,
  truncateTables,
} from '../../../../../../test/integration/test-datasource';
import { startMySqlTestContainer } from '../../../../../../test/integration/mysql-test-container';
import { SuperLinea } from '../../domain/entities/superlinea.entity';
import { PoliticaCreacionSuperLinea } from '../../domain/services/politica-creacion-superlinea.service';
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

  it('Registra una SuperLínea válida con o sin observación opcional', async () => {
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
    'Trata la variante de mayúsculas y tildes %s como una denominación reservada',
    async (candidate) => {
      await createSuperLinea('Máquinas', null, new Date());

      const existing = await adapter.findByDenominacionWithDeleted(candidate);

      expect(existing).toEqual(expect.objectContaining({ denominacion: 'Máquinas' }));
    },
  );

  it('Lista únicamente los registros activos e informa el total real', async () => {
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

  it('Persiste una modificación conservando el identificador', async () => {
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

  it('La política no detecta conflicto al conservar la propia denominación, pero sí con otro registro', async () => {
    const id = await createSuperLinea('Bebidas');
    const policy = new PoliticaCreacionSuperLinea(adapter);

    // The conflict query itself returns the existing record; excluding the
    // current entity is the policy's responsibility (service passes the id).
    await expect(
      policy.checkDenominacionExists('bebidas', id),
    ).resolves.toBe(false);
    await expect(
      policy.checkDenominacionExists('bebidas'),
    ).resolves.toBe(true);
    await expect(
      policy.checkDenominacionExists('bebidas', id + 1),
    ).resolves.toBe(true);
  });

  it('Elimina lógicamente una SuperLínea y la excluye del detalle', async () => {
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

  it('Seleccionar superlíneas por coincidencia parcial sin distinguir mayúsculas', async () => {
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

  it('Buscar "linea" no devuelve "línea"', async () => {
    await createSuperLinea('línea acento');
    await createSuperLinea('Alfa linea');

    const result = await adapter.busquedaPorCoincidenciaParcial('linea');

    expect(result.map((superLinea) => superLinea.denominacion)).toEqual([
      'Alfa linea',
    ]);
  });

  it('Un término con tilde solo coincide con denominaciones con tilde', async () => {
    await createSuperLinea('línea premium');
    await createSuperLinea('Alfa linea');

    const result = await adapter.busquedaPorCoincidenciaParcial('línea');

    expect(result.map((superLinea) => superLinea.denominacion)).toEqual([
      'línea premium',
    ]);
  });

  it('Un término sin coincidencias devuelve una colección vacía', async () => {
    await createSuperLinea('Arroz');

    const result = await adapter.busquedaPorCoincidenciaParcial('trigo');

    expect(result).toEqual([]);
  });

  it('Un término vacío o de solo espacios devuelve una colección vacía', async () => {
    await expect(adapter.busquedaPorCoincidenciaParcial('')).resolves.toEqual([]);
    await expect(adapter.busquedaPorCoincidenciaParcial('   ')).resolves.toEqual([]);
  });

  it('Solo se ofrecen superlíneas activas (excluye las eliminadas lógicamente)', async () => {
    await createSuperLinea('Alfa linea');
    await createSuperLinea('Beta linea', null, new Date());

    const result = await adapter.busquedaPorCoincidenciaParcial('linea');

    expect(result.map((superLinea) => superLinea.denominacion)).toEqual([
      'Alfa linea',
    ]);
  });
});

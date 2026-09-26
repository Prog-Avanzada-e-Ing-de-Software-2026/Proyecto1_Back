import { DataSource } from 'typeorm';
import type { StartedMySqlContainer } from '@testcontainers/mysql';
import {
  createInitializedTestDataSource,
  truncateTables,
} from './test-datasource';
import { mySqlTestConnection, startMySqlTestContainer } from './mysql-test-container';
import { Presentacion } from 'src/modules/gestion-productos/presentacion/domain/entities/presentacion.entity';

describe('Integration harness safety', () => {
  let container: StartedMySqlContainer;
  let dataSource: DataSource;

  beforeAll(async () => {
    container = await startMySqlTestContainer();
    dataSource = await createInitializedTestDataSource(container);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (container) await container.stop();
  });

  it('per-file helper exposes a usable container connection', () => {
    const config = mySqlTestConnection(container);

    expect(config).toEqual(
      expect.objectContaining({
        host: expect.any(String),
        port: expect.any(Number),
        database: expect.any(String),
      }),
    );
  });

  it('real migrations created the presentacion table and registered the Presentacion entity', async () => {
    const rows = await dataSource.query("SHOW TABLES LIKE 'presentacion'");
    expect(rows.length).toBeGreaterThan(0);

    const metadata = dataSource.getMetadata(Presentacion);
    expect(metadata.tableName).toBe('presentacion');
  });

  it('truncateTables always restores FOREIGN_KEY_CHECKS', async () => {
    await truncateTables(dataSource);

    const [{ value }] = await dataSource.query(
      'SELECT @@FOREIGN_KEY_CHECKS AS value',
    );
    expect(Number(value)).toBe(1);
  });
});

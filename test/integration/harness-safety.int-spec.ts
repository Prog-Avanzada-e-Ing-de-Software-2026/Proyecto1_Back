import { DataSource } from 'typeorm';
import {
  createInitializedTestDataSource,
  truncateTables,
} from './test-datasource';
import { getSharedContainer, readConnectionFile } from './connection';
import { Presentacion } from 'src/modules/gestion-productos/presentacion/domain/entities/presentacion.entity';

describe('Integration harness safety', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createInitializedTestDataSource();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('global setup removed stale state and wrote a usable connection file', () => {
    const config = readConnectionFile();

    expect(config).toEqual(
      expect.objectContaining({
        host: expect.any(String),
        port: expect.any(Number),
        database: expect.any(String),
      }),
    );
    expect(getSharedContainer()).toBeDefined();
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

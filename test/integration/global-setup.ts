import { MySqlContainer } from '@testcontainers/mysql';
import { DataSource } from 'typeorm';
import { setSharedContainer, writeConnectionFile } from './connection';
import { Init1787269586538 } from '../../src/migrations/1787269586538-Init';
import { AddSuperLineaToLinea1789091969000 } from '../../src/migrations/1789091969000-AddSuperLineaToLinea';
import { AddCambioPrecioToProducto1789351169000 } from '../../src/migrations/1789351169000-AddCambioPrecioToProducto';

/**
 * Starts one MySQL 8 container for the whole integration run, applies the real
 * migrations and hands the connection details to the specs through a temp file
 * (Jest does not reliably propagate env vars from globalSetup to workers).
 *
 * Only migrations are registered here: runMigrations does not need entities,
 * which keeps this file free of application `src/...` alias imports that the
 * globalSetup module registry cannot resolve.
 */
export default async function globalSetup(): Promise<void> {
  const container = await new MySqlContainer('mysql:8.0')
    .withDatabase('test')
    .withUsername('test')
    .withUserPassword('test')
    .withRootPassword('testpass')
    .start();

  setSharedContainer(container);

  const config = {
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getUserPassword(),
    database: container.getDatabase(),
    rootUsername: 'root',
    rootPassword: container.getRootPassword(),
  };

  const dataSource = new DataSource({
    type: 'mysql',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    entities: [],
    migrations: [
      Init1787269586538,
      AddSuperLineaToLinea1789091969000,
      AddCambioPrecioToProducto1789351169000,
    ],
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  try {
    await dataSource.runMigrations();
  } finally {
    await dataSource.destroy();
  }

  writeConnectionFile(config);
}

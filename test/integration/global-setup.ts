import { MySqlContainer, type StartedMySqlContainer } from '@testcontainers/mysql';
import { DataSource } from 'typeorm';
import { removeConnectionFile, setSharedContainer, writeConnectionFile } from './connection';
import { Init1787269586538 } from '../../src/migrations/1787269586538-Init';
import { AddSuperLineaToLinea1789091969000 } from '../../src/migrations/1789091969000-AddSuperLineaToLinea';
import { AddCambioPrecioToProducto1789351169000 } from '../../src/migrations/1789351169000-AddCambioPrecioToProducto';
import { AddPresentacionToProducto1789200000000 } from '../../src/migrations/1789200000000-AddPresentacionToProducto';

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
  // Remove any stale connection file left by a previous aborted run so specs
  // do not read outdated ports if setup fails part-way through.
  removeConnectionFile();

  let container: StartedMySqlContainer | undefined;

  try {
    container = await new MySqlContainer('mysql:8.0')
      .withDatabase('test')
      .withUsername('test')
      .withUserPassword('test')
      .withRootPassword('testpass')
      // This host stores Docker's data-root on a rotational HDD, where MySQL 8's
      // datadir initialization takes ~146 s and exceeds Testcontainers' default
      // 120 s startup timeout. Mounting the datadir on tmpfs keeps it in RAM and
      // brings startup down to a few seconds. The data is intentionally
      // ephemeral: integration tests need a real MySQL 8 server, not persistence.
      .withTmpFs({ '/var/lib/mysql': 'rw,size=1g' })
      .withStartupTimeout(300_000)
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
        AddPresentacionToProducto1789200000000,
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
  } catch (error) {
    // Guarantee the container is stopped and the connection file is removed
    // even if `initialize()` or `runMigrations()` fails. A `stop()` failure
    // must not prevent the file cleanup that follows it.
    if (container) {
      try {
        await container.stop();
      } catch {
        // Best-effort stop; continue with cleanup.
      }
    }
    removeConnectionFile();
    throw error;
  }
}

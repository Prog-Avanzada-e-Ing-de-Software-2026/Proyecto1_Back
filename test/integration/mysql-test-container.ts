import { MySqlContainer, type StartedMySqlContainer } from '@testcontainers/mysql';

export interface MySqlTestConnectionOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  database?: string;
}

/**
 * Starts an ephemeral MySQL 8 container for a single integration spec file.
 *
 * The datadir is mounted on tmpfs because this host stores Docker's data-root
 * on a rotational HDD, where MySQL 8 initialization takes ~146 s and exceeds
 * the default 120 s startup timeout; keeping it in RAM brings startup down to
 * a few seconds. The data is intentionally ephemeral: integration tests need a
 * real MySQL 8 server, not persistence.
 *
 * Callers own the container lifecycle: start it in `beforeAll` and stop it in
 * `afterAll`.
 */
export async function startMySqlTestContainer(): Promise<StartedMySqlContainer> {
  return new MySqlContainer('mysql:8.0')
    .withDatabase('test')
    .withRootPassword('testpass')
    .withTmpFs({ '/var/lib/mysql': 'rw,size=1g' })
    .withStartupTimeout(300_000)
    .start();
}

/**
 * Builds the connection options for a started container. Defaults to the
 * `root` user and the container's default database; pass `overrides` to select
 * another database or user.
 */
export function mySqlTestConnection(
  container: StartedMySqlContainer,
  overrides: Partial<MySqlTestConnectionOptions> = {},
): MySqlTestConnectionOptions {
  return {
    host: container.getHost(),
    port: container.getPort(),
    username: 'root',
    password: container.getRootPassword(),
    database: 'test',
    ...overrides,
  };
}

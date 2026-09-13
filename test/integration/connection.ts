import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import type { StartedMySqlContainer } from '@testcontainers/mysql';

/**
 * Connection details for the shared Testcontainers MySQL instance.
 * Kept in a standalone module with no application imports so it can be loaded
 * from Jest globalSetup/globalTeardown, where moduleNameMapper does not apply.
 */
export interface TestDatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  rootUsername: string;
  rootPassword: string;
}

const CONNECTION_FILE = join(tmpdir(), 'cr004-testcontainers-connection.json');
const SHARED_CONTAINER_KEY = '__CR004_TESTCONTAINERS_MYSQL__';

export function writeConnectionFile(config: TestDatabaseConfig): void {
  mkdirSync(dirname(CONNECTION_FILE), { recursive: true });
  writeFileSync(CONNECTION_FILE, JSON.stringify(config), 'utf8');
}

export function readConnectionFile(): TestDatabaseConfig {
  return JSON.parse(readFileSync(CONNECTION_FILE, 'utf8')) as TestDatabaseConfig;
}

export function removeConnectionFile(): void {
  rmSync(CONNECTION_FILE, { force: true });
}

export function setSharedContainer(container: StartedMySqlContainer): void {
  (globalThis as Record<string, unknown>)[SHARED_CONTAINER_KEY] = container;
}

export function getSharedContainer(): StartedMySqlContainer | undefined {
  return (globalThis as Record<string, unknown>)[SHARED_CONTAINER_KEY] as
    | StartedMySqlContainer
    | undefined;
}

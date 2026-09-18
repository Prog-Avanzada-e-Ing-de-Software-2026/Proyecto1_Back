import { DataSource } from 'typeorm';
import type {
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import type { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { readConnectionFile } from './connection';
import type { TestDatabaseConfig } from './connection';

// Entities are imported by class (never by glob): TypeORM globs resolve .ts files
// through the native require, which is not transpiled under Jest.
import { Linea } from 'src/modules/gestion-productos/linea/domain/entities/linea.entity';
import { Marca } from 'src/modules/gestion-productos/marca/domain/entities/marca.entity';
import { Presentacion } from 'src/modules/gestion-productos/presentacion/domain/entities/presentacion.entity';
import { CambioPrecio } from 'src/modules/gestion-productos/producto/domain/entities/cambio-precio.entity';
import { Producto } from 'src/modules/gestion-productos/producto/domain/entities/producto.entity';
import { ProductoOperacion } from 'src/modules/gestion-productos/producto-operacion/entities/producto-operacion.entity';
import { SuperLinea } from 'src/modules/gestion-productos/superlinea/domain/entities/superlinea.entity';
import { ConfiguracionSistema } from 'src/modules/gestion-sistema/configuracion-sistema/domain/entities/configuracion-sistema.entity';
import { Rol } from 'src/modules/gestion-usuario/rol/domain/entities/rol.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { AlicuotaIva } from 'src/modules/gutil/alicuota-iva/domain/entities/alicuota-iva.entity';
import { CondicionIva } from 'src/modules/gutil/condicion-iva/domain/entities/condicion-iva.entity';
import { Domicilio } from 'src/modules/gutil/domicilio/entities/domicilio.entity';
import { Localidad } from 'src/modules/gutil/localidad/domain/entities/localidad.entity';
import { Provincia } from 'src/modules/gutil/provincia/domain/entities/provincia.entity';
import { Cliente } from 'src/modules/organizacion/cliente/domain/entities/cliente.entity';
import { ClienteOperacion } from 'src/modules/organizacion/cliente-operacion/entities/cliente-operacion.entity';
import { Empresa } from 'src/modules/organizacion/empresa/domain/entities/empresa.entity';
import { EmpresaOperacion } from 'src/modules/organizacion/empresa-operacion/entities/empresa-operacion.entity';
import { Personal } from 'src/modules/organizacion/personal/domain/entities/personal.entity';
import { Proveedor } from 'src/modules/organizacion/proveedor/domain/entities/proveedor.entity';
import { ProveedorOperacion } from 'src/modules/organizacion/proveedor-operacion/entities/proveedor-operacion.entity';

import { Init1787269586538 } from 'src/migrations/1787269586538-Init';
import { AddSuperLineaToLinea1789091969000 } from 'src/migrations/1789091969000-AddSuperLineaToLinea';
import { AddCambioPrecioToProducto1789351169000 } from 'src/migrations/1789351169000-AddCambioPrecioToProducto';
import { AddPresentacionToProducto1789200000000 } from 'src/migrations/1789200000000-AddPresentacionToProducto';

export {
  getSharedContainer,
  readConnectionFile,
  removeConnectionFile,
  setSharedContainer,
  writeConnectionFile,
} from './connection';
export type { TestDatabaseConfig } from './connection';

/**
 * All decorated application entities. Registering the full set (instead of only
 * the CR-004 entities) keeps TypeORM metadata resolution happy for every
 * relation reachable from Producto, Linea, SuperLinea and Marca.
 */
export const TEST_ENTITIES = [
  Linea,
  Marca,
  Presentacion,
  Producto,
  CambioPrecio,
  ProductoOperacion,
  SuperLinea,
  ConfiguracionSistema,
  Rol,
  Usuario,
  AlicuotaIva,
  CondicionIva,
  Domicilio,
  Localidad,
  Provincia,
  Cliente,
  ClienteOperacion,
  Empresa,
  EmpresaOperacion,
  Personal,
  Proveedor,
  ProveedorOperacion,
];

export const TEST_MIGRATIONS = [
  Init1787269586538,
  AddSuperLineaToLinea1789091969000,
  AddCambioPrecioToProducto1789351169000,
  AddPresentacionToProducto1789200000000,
];

/** Tables owned by the CR-004 persistence specs, cleaned between tests. */
export const TEST_TABLES = [
  'producto',
  'cambio_precio',
  'producto_operacion',
  'presentacion',
  'linea',
  'super_linea',
  'marca',
  'proveedor_operacion',
  'proveedor',
  'usuario',
];

/**
 * Builds (but does not initialize) a DataSource against the shared MySQL
 * container. `database` may be overridden by specs that manage their own schema.
 */
export function createTestDataSource(
  overrides: Partial<TestDatabaseConfig> = {},
): DataSource {
  const config = { ...readConnectionFile(), ...overrides };
  return new DataSource({
    type: 'mysql',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    entities: TEST_ENTITIES,
    migrations: TEST_MIGRATIONS,
    synchronize: false,
    logging: false,
  });
}

export async function createInitializedTestDataSource(
  overrides: Partial<TestDatabaseConfig> = {},
): Promise<DataSource> {
  const dataSource = createTestDataSource(overrides);
  await dataSource.initialize();
  return dataSource;
}

/**
 * Minimal UnitOfWork for the CR-004 read queries. The tested methods never
 * touch it; write methods that use it are out of scope for these specs.
 */
export function createUnitOfWorkStub(dataSource: DataSource): IUnitOfWork {
  return {
    start: async () => undefined,
    commit: async () => undefined,
    rollback: async () => undefined,
    release: async () => undefined,
    getManager: (): EntityManager => dataSource.manager,
    getRepository: <T extends ObjectLiteral>(
      target: EntityTarget<T>,
    ): Repository<T> => dataSource.getRepository(target),
  };
}

/**
 * Removes every fixture row. FK checks are disabled around the truncation so
 * the order of the table list does not matter.
 */
export async function truncateTables(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  let restoreError: unknown;

  try {
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of TEST_TABLES) {
      await queryRunner.query(`TRUNCATE TABLE \`${table}\``);
    }
  } finally {
    try {
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (error) {
      restoreError = error;
    } finally {
      await queryRunner.release();
    }

    if (restoreError) {
      throw restoreError;
    }
  }
}

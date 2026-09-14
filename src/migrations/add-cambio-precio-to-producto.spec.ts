import { DataSource } from 'typeorm';
import {
  MySqlContainer,
  StartedMySqlContainer,
} from '@testcontainers/mysql';
import { AddCambioPrecioToProducto1789351169000 } from './1789351169000-AddCambioPrecioToProducto';

jest.setTimeout(120_000);

describe('AddCambioPrecioToProducto1789351169000 migration', () => {
  const databaseName = `cr007_migration_${process.pid}`;
  let mysql: StartedMySqlContainer;
  let admin: DataSource;
  let fixture: DataSource;

  beforeAll(async () => {
    mysql = await new MySqlContainer('mysql:8.0').start();
    admin = createDataSource();
    await admin.initialize();
    await admin.query(`CREATE DATABASE \`${databaseName}\``);
  });

  beforeEach(async () => {
    if (fixture?.isInitialized) await fixture.destroy();
    await admin.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
    await admin.query(`CREATE DATABASE \`${databaseName}\``);

    fixture = createDataSource(databaseName);
    await fixture.initialize();
  });

  afterAll(async () => {
    if (fixture?.isInitialized) await fixture.destroy();
    if (admin?.isInitialized) {
      await admin.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
      await admin.destroy();
    }
    if (mysql) await mysql.stop();
  });

  it('creates the cambio_precio table with its mandatory columns and cascading relation', async () => {
    await fixture.query(`
      CREATE TABLE \`producto\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await migrateUp(fixture);

    const [table] = await fixture.query(
      "SELECT `TABLE_NAME` FROM `information_schema`.`TABLES` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'cambio_precio'",
    );
    const columns = await fixture.query(
      "SELECT `COLUMN_NAME`, `IS_NULLABLE` FROM `information_schema`.`COLUMNS` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'cambio_precio' ORDER BY `ORDINAL_POSITION`",
    );
    const [foreignKey] = await fixture.query(
      "SELECT `DELETE_RULE` FROM `information_schema`.`REFERENTIAL_CONSTRAINTS` WHERE `CONSTRAINT_SCHEMA` = DATABASE() AND `CONSTRAINT_NAME` = 'FK_cambio_precio_producto'",
    );
    const indexes = await fixture.query(
      "SELECT `INDEX_NAME` FROM `information_schema`.`STATISTICS` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'cambio_precio' AND `INDEX_NAME` != 'PRIMARY'",
    );

    expect(table).toBeDefined();
    expect(columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ COLUMN_NAME: 'id', IS_NULLABLE: 'NO' }),
        expect.objectContaining({
          COLUMN_NAME: 'producto_id',
          IS_NULLABLE: 'NO',
        }),
        expect.objectContaining({
          COLUMN_NAME: 'precioAnterior',
          IS_NULLABLE: 'NO',
        }),
        expect.objectContaining({
          COLUMN_NAME: 'precioNuevo',
          IS_NULLABLE: 'NO',
        }),
        expect.objectContaining({ COLUMN_NAME: 'fecha', IS_NULLABLE: 'NO' }),
        expect.objectContaining({ COLUMN_NAME: 'motivo', IS_NULLABLE: 'NO' }),
      ]),
    );
    expect(foreignKey).toEqual(
      expect.objectContaining({ DELETE_RULE: 'CASCADE' }),
    );
    expect(
      indexes.map((index: { INDEX_NAME: string }) => index.INDEX_NAME),
    ).toEqual(
      expect.arrayContaining([
        'IDX_cambio_precio_producto_id',
        'IDX_cambio_precio_fecha',
      ]),
    );
  });

  it('stores a price change for a product and rejects an invalid product reference', async () => {
    await fixture.query(`
      CREATE TABLE \`producto\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await migrateUp(fixture);

    const producto = await fixture.query('INSERT INTO `producto` VALUES ()');
    await fixture.query(
      "INSERT INTO `cambio_precio` (`producto_id`, `precioAnterior`, `precioNuevo`, `fecha`, `motivo`) VALUES (?, 100, 150, CURRENT_TIMESTAMP, 'ActualizacionDeCosto')",
      [producto.insertId],
    );

    const cambios = await fixture.query(
      'SELECT `precioAnterior`, `precioNuevo`, `motivo` FROM `cambio_precio`',
    );
    expect(cambios).toEqual([
      {
        precioAnterior: '100.00000',
        precioNuevo: '150.00000',
        motivo: 'ActualizacionDeCosto',
      },
    ]);

    await expect(
      fixture.query(
        "INSERT INTO `cambio_precio` (`producto_id`, `precioAnterior`, `precioNuevo`, `fecha`, `motivo`) VALUES (999999, 150, 200, CURRENT_TIMESTAMP, 'ActualizacionDeCosto')",
      ),
    ).rejects.toThrow();
  });

  it('reverses the table without deleting existing products', async () => {
    await fixture.query(`
      CREATE TABLE \`producto\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    const producto = await fixture.query('INSERT INTO `producto` VALUES ()');

    const migration = new AddCambioPrecioToProducto1789351169000();
    const queryRunner = fixture.createQueryRunner();
    await migration.up(queryRunner);
    await migration.down(queryRunner);
    await queryRunner.release();

    const productos = await fixture.query('SELECT `id` FROM `producto`');
    const cambioPrecioTable = await fixture.query(
      "SELECT `TABLE_NAME` FROM `information_schema`.`TABLES` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'cambio_precio'",
    );

    expect(productos).toEqual([{ id: producto.insertId }]);
    expect(cambioPrecioTable).toEqual([]);
  });

  async function migrateUp(dataSource: DataSource): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();
    await new AddCambioPrecioToProducto1789351169000().up(queryRunner);
    await queryRunner.release();
  }

  function createDataSource(database?: string): DataSource {
    return new DataSource({
      type: 'mysql',
      host: mysql.getHost(),
      port: mysql.getPort(),
      username: 'root',
      password: mysql.getRootPassword(),
      database,
      logging: false,
    });
  }
});
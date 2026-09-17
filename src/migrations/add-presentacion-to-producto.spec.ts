import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { AddPresentacionToProducto1789200000000 } from './1789200000000-AddPresentacionToProducto';

config({ path: '.env' });

describe('AddPresentacionToProducto1789200000000 migration', () => {
  const databaseName = `cr002_migration_${process.pid}`;
  let admin: DataSource;
  let fixture: DataSource;

  beforeAll(async () => {
    admin = createDataSource();
    await admin.initialize();
    await admin.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
    await admin.query(`CREATE DATABASE \`${databaseName}\``);
  });

  beforeEach(async () => {
    if (fixture?.isInitialized) await fixture.destroy();
    await admin.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
    await admin.query(`CREATE DATABASE \`${databaseName}\``);

    fixture = createDataSource(databaseName);
    await fixture.initialize();
    await fixture.query(`
      CREATE TABLE \`producto\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`denominacion\` text NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
  });

  afterAll(async () => {
    if (fixture?.isInitialized) await fixture.destroy();
    if (admin?.isInitialized) {
      await admin.query(`DROP DATABASE IF EXISTS \`${databaseName}\``);
      await admin.destroy();
    }
  });

  it('backfills populated products before enforcing the required restrictive relation', async () => {
    await fixture.query(
      "INSERT INTO `producto` (`denominacion`) VALUES ('Coca-Cola 2L'), ('Sprite 500ml')",
    );

    await migrateUp(fixture);

    const temporal = await fixture.query(
      "SELECT `id`, `denominacion`, `deletedAt` FROM `presentacion` WHERE `denominacion` = 'Temporal'",
    );
    const products = await fixture.query(
      'SELECT `presentacion_id` FROM `producto` ORDER BY `id`',
    );
    const [column] = await fixture.query(
      "SELECT `IS_NULLABLE` FROM `information_schema`.`COLUMNS` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'producto' AND `COLUMN_NAME` = 'presentacion_id'",
    );
    const [foreignKey] = await fixture.query(
      "SELECT `DELETE_RULE` FROM `information_schema`.`REFERENTIAL_CONSTRAINTS` WHERE `CONSTRAINT_SCHEMA` = DATABASE() AND `CONSTRAINT_NAME` = 'FK_producto_presentacion'",
    );

    expect(temporal).toEqual([
      expect.objectContaining({ denominacion: 'Temporal', deletedAt: null }),
    ]);
    expect(products).toHaveLength(2);
    expect(
      products.map((product: { presentacion_id: number }) => product.presentacion_id),
    ).toEqual([temporal[0].id, temporal[0].id]);
    expect(column.IS_NULLABLE).toBe('NO');
    expect(foreignKey.DELETE_RULE).toBe('RESTRICT');
  });

  it('creates an active Temporal record and the mandatory column for an empty product table', async () => {
    await migrateUp(fixture);

    const temporal = await fixture.query(
      "SELECT `denominacion`, `deletedAt` FROM `presentacion` WHERE `denominacion` = 'Temporal'",
    );
    const [column] = await fixture.query(
      "SELECT `IS_NULLABLE` FROM `information_schema`.`COLUMNS` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'producto' AND `COLUMN_NAME` = 'presentacion_id'",
    );

    expect(temporal).toEqual([{ denominacion: 'Temporal', deletedAt: null }]);
    expect(column.IS_NULLABLE).toBe('NO');
  });

  it('rejects duplicate denominations and invalid product references', async () => {
    await migrateUp(fixture);

    await expect(
      fixture.query(
        "INSERT INTO `presentacion` (`denominacion`) VALUES ('Temporal')",
      ),
    ).rejects.toThrow();
    await expect(
      fixture.query(
        "INSERT INTO `producto` (`denominacion`, `presentacion_id`) VALUES ('Invalid', 999999)",
      ),
    ).rejects.toThrow();
  });

  it('reverses the relationship and table without deleting existing products', async () => {
    await fixture.query(
      "INSERT INTO `producto` (`denominacion`) VALUES ('Coca-Cola 2L')",
    );
    const migration = new AddPresentacionToProducto1789200000000();
    const queryRunner = fixture.createQueryRunner();
    await migration.up(queryRunner);

    await migration.down(queryRunner);
    await queryRunner.release();

    const products = await fixture.query(
      'SELECT `denominacion` FROM `producto`',
    );
    const presentacionTable = await fixture.query(
      "SELECT `TABLE_NAME` FROM `information_schema`.`TABLES` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'presentacion'",
    );
    const relationColumn = await fixture.query(
      "SELECT `COLUMN_NAME` FROM `information_schema`.`COLUMNS` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'producto' AND `COLUMN_NAME` = 'presentacion_id'",
    );

    expect(products).toEqual([{ denominacion: 'Coca-Cola 2L' }]);
    expect(presentacionTable).toEqual([]);
    expect(relationColumn).toEqual([]);
  });

  it('creates, reassigns and reads Producto associations on migrated MySQL', async () => {
    await migrateUp(fixture);
    const [temporal] = await fixture.query(
      "SELECT `id` FROM `presentacion` WHERE `denominacion` = 'Temporal' AND `deletedAt` IS NULL",
    );
    await fixture.query(
      "INSERT INTO `producto` (`denominacion`, `presentacion_id`) VALUES ('Coca-Cola', ?)",
      [temporal.id],
    );
    const replacement = await fixture.query(
      "INSERT INTO `presentacion` (`denominacion`) VALUES ('1L')",
    );
    const replacementId = replacement.insertId;
    await fixture.query(
      'UPDATE `producto` SET `presentacion_id` = ? WHERE `denominacion` = ?',
      [replacementId, 'Coca-Cola'],
    );
    const rows = await fixture.query(
      'SELECT p.`denominacion`, pr.`id`, pr.`denominacion` AS `presentacion` FROM `producto` p INNER JOIN `presentacion` pr ON pr.`id` = p.`presentacion_id` ORDER BY p.`denominacion`',
    );

    expect(rows).toEqual([
      {
        denominacion: 'Coca-Cola',
        id: replacementId,
        presentacion: '1L',
      },
    ]);
  });

  async function migrateUp(dataSource: DataSource): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();
    await new AddPresentacionToProducto1789200000000().up(queryRunner);
    await queryRunner.release();
  }

  function createDataSource(database?: string): DataSource {
    return new DataSource({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database,
      logging: false,
    });
  }
});

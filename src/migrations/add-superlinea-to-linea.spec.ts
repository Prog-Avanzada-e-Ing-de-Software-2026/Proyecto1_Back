import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { AddSuperLineaToLinea1789091969000 } from './1789091969000-AddSuperLineaToLinea';

config({ path: '.env' });

describe('AddSuperLineaToLinea1789091969000 migration', () => {
  const databaseName = `cr003_migration_${process.pid}`;
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
      CREATE TABLE \`linea\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`denominacion\` varchar(255) NOT NULL,
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

  it('backfills populated lines before enforcing the required restrictive relation', async () => {
    await fixture.query(
      "INSERT INTO `linea` (`denominacion`) VALUES ('Herramientas'), ('Pinturas')",
    );

    await migrateUp(fixture);

    const temporal = await fixture.query(
      "SELECT `id`, `denominacion`, `deletedAt` FROM `super_linea` WHERE `denominacion` = 'Temporal'",
    );
    const lines = await fixture.query(
      'SELECT `super_linea_id` FROM `linea` ORDER BY `id`',
    );
    const [column] = await fixture.query(
      "SELECT `IS_NULLABLE` FROM `information_schema`.`COLUMNS` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'linea' AND `COLUMN_NAME` = 'super_linea_id'",
    );
    const [foreignKey] = await fixture.query(
      "SELECT `DELETE_RULE` FROM `information_schema`.`REFERENTIAL_CONSTRAINTS` WHERE `CONSTRAINT_SCHEMA` = DATABASE() AND `CONSTRAINT_NAME` = 'FK_linea_super_linea'",
    );

    expect(temporal).toEqual([
      expect.objectContaining({ denominacion: 'Temporal', deletedAt: null }),
    ]);
    expect(lines).toHaveLength(2);
    expect(lines.map((line: { super_linea_id: number }) => line.super_linea_id)).toEqual([
      temporal[0].id,
      temporal[0].id,
    ]);
    expect(column.IS_NULLABLE).toBe('NO');
    expect(foreignKey.DELETE_RULE).toBe('RESTRICT');
  });

  it('creates an active Temporal record and the mandatory column for an empty line table', async () => {
    await migrateUp(fixture);

    const temporal = await fixture.query(
      "SELECT `denominacion`, `deletedAt` FROM `super_linea` WHERE `denominacion` = 'Temporal'",
    );
    const [column] = await fixture.query(
      "SELECT `IS_NULLABLE` FROM `information_schema`.`COLUMNS` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'linea' AND `COLUMN_NAME` = 'super_linea_id'",
    );

    expect(temporal).toEqual([{ denominacion: 'Temporal', deletedAt: null }]);
    expect(column.IS_NULLABLE).toBe('NO');
  });

  it('rejects duplicate denominations and invalid line references', async () => {
    await migrateUp(fixture);

    await expect(
      fixture.query(
        "INSERT INTO `super_linea` (`denominacion`) VALUES ('Temporal')",
      ),
    ).rejects.toThrow();
    await expect(
      fixture.query(
        "INSERT INTO `linea` (`denominacion`, `super_linea_id`) VALUES ('Invalid', 999999)",
      ),
    ).rejects.toThrow();
  });

  it('reverses the relationship and table without deleting existing lines', async () => {
    await fixture.query(
      "INSERT INTO `linea` (`denominacion`) VALUES ('Herramientas')",
    );
    const migration = new AddSuperLineaToLinea1789091969000();
    const queryRunner = fixture.createQueryRunner();
    await migration.up(queryRunner);

    await migration.down(queryRunner);
    await queryRunner.release();

    const lines = await fixture.query('SELECT `denominacion` FROM `linea`');
    const superLineaTable = await fixture.query(
      "SELECT `TABLE_NAME` FROM `information_schema`.`TABLES` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'super_linea'",
    );
    const relationColumn = await fixture.query(
      "SELECT `COLUMN_NAME` FROM `information_schema`.`COLUMNS` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'linea' AND `COLUMN_NAME` = 'super_linea_id'",
    );

    expect(lines).toEqual([{ denominacion: 'Herramientas' }]);
    expect(superLineaTable).toEqual([]);
    expect(relationColumn).toEqual([]);
  });

  it('creates, reassigns and reads Linea associations on migrated MySQL', async () => {
    await migrateUp(fixture);
    const [temporal] = await fixture.query(
      "SELECT `id` FROM `super_linea` WHERE `denominacion` = 'Temporal' AND `deletedAt` IS NULL",
    );
    await fixture.query(
      "INSERT INTO `linea` (`denominacion`, `super_linea_id`) VALUES ('Herramientas', ?)",
      [temporal.id],
    );
    const replacement = await fixture.query(
      "INSERT INTO `super_linea` (`denominacion`) VALUES ('Replacement')",
    );
    const replacementId = replacement.insertId;
    await fixture.query(
      'UPDATE `linea` SET `super_linea_id` = ? WHERE `denominacion` = ?',
      [replacementId, 'Herramientas'],
    );
    const rows = await fixture.query(
      'SELECT l.`denominacion`, s.`id`, s.`denominacion` AS `superLinea` FROM `linea` l INNER JOIN `super_linea` s ON s.`id` = l.`super_linea_id` ORDER BY l.`denominacion`',
    );

    expect(rows).toEqual([{
      denominacion: 'Herramientas',
      id: replacementId,
      superLinea: 'Replacement',
    }]);
  });

  async function migrateUp(dataSource: DataSource): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();
    await new AddSuperLineaToLinea1789091969000().up(queryRunner);
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

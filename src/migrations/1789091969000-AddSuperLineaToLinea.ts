import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuperLineaToLinea1789091969000 implements MigrationInterface {
  name = 'AddSuperLineaToLinea1789091969000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`super_linea\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`denominacion\` varchar(255) NOT NULL,
        \`observacion\` text NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        \`usuarioCreatedId\` int NULL,
        \`usuarioDeletedId\` int NULL,
        \`usuarioUpdatedId\` int NULL,
        CONSTRAINT \`UQ_super_linea_denominacion\` UNIQUE (\`denominacion\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      INSERT INTO \`super_linea\` (\`denominacion\`)
      VALUES ('Temporal')
    `);
    await queryRunner.query(`
      ALTER TABLE \`linea\`
      ADD \`super_linea_id\` int NULL
    `);
    await queryRunner.query(`
      UPDATE \`linea\`
      SET \`super_linea_id\` = (
        SELECT \`id\`
        FROM \`super_linea\`
        WHERE \`denominacion\` = 'Temporal' AND \`deletedAt\` IS NULL
        LIMIT 1
      )
      WHERE \`super_linea_id\` IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE \`linea\`
      MODIFY \`super_linea_id\` int NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX \`IDX_linea_super_linea_id\`
      ON \`linea\` (\`super_linea_id\`)
    `);
    await queryRunner.query(`
      ALTER TABLE \`linea\`
      ADD CONSTRAINT \`FK_linea_super_linea\`
      FOREIGN KEY (\`super_linea_id\`) REFERENCES \`super_linea\`(\`id\`)
      ON DELETE RESTRICT ON UPDATE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `linea` DROP FOREIGN KEY `FK_linea_super_linea`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_linea_super_linea_id` ON `linea`',
    );
    await queryRunner.query(
      'ALTER TABLE `linea` DROP COLUMN `super_linea_id`',
    );
    await queryRunner.query('DROP TABLE `super_linea`');
  }
}

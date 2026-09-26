import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPresentacionToProducto1789200000000
  implements MigrationInterface
{
  name = 'AddPresentacionToProducto1789200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`presentacion\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`denominacion\` varchar(255) NOT NULL,
        \`observacion\` text NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deletedAt\` datetime(6) NULL,
        \`usuarioCreatedId\` int NULL,
        \`usuarioDeletedId\` int NULL,
        \`usuarioUpdatedId\` int NULL,
        CONSTRAINT \`UQ_presentacion_denominacion\` UNIQUE (\`denominacion\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      INSERT INTO \`presentacion\` (\`denominacion\`)
      VALUES ('Temporal')
    `);
    await queryRunner.query(`
      ALTER TABLE \`producto\`
      ADD \`presentacion_id\` int NULL
    `);
    await queryRunner.query(`
      UPDATE \`producto\`
      SET \`presentacion_id\` = (
        SELECT \`id\`
        FROM \`presentacion\`
        WHERE \`denominacion\` = 'Temporal' AND \`deletedAt\` IS NULL
        LIMIT 1
      )
      WHERE \`presentacion_id\` IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE \`producto\`
      MODIFY \`presentacion_id\` int NOT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX \`IDX_producto_presentacion_id\`
      ON \`producto\` (\`presentacion_id\`)
    `);
    await queryRunner.query(`
      ALTER TABLE \`producto\`
      ADD CONSTRAINT \`FK_producto_presentacion\`
      FOREIGN KEY (\`presentacion_id\`) REFERENCES \`presentacion\`(\`id\`)
      ON DELETE RESTRICT ON UPDATE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `producto` DROP FOREIGN KEY `FK_producto_presentacion`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_producto_presentacion_id` ON `producto`',
    );
    await queryRunner.query(
      'ALTER TABLE `producto` DROP COLUMN `presentacion_id`',
    );
    await queryRunner.query('DROP TABLE `presentacion`');
  }
}

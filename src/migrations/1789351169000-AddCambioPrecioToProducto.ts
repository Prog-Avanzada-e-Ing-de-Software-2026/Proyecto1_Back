import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCambioPrecioToProducto1789351169000
  implements MigrationInterface
{
  name = 'AddCambioPrecioToProducto1789351169000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`cambio_precio\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`producto_id\` int NOT NULL,
        \`precioAnterior\` decimal(15,5) NOT NULL DEFAULT '0.00000',
        \`precioNuevo\` decimal(15,5) NOT NULL DEFAULT '0.00000',
        \`fecha\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`motivo\` varchar(255) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE INDEX \`IDX_cambio_precio_producto_id\`
      ON \`cambio_precio\` (\`producto_id\`)
    `);
    await queryRunner.query(`
      CREATE INDEX \`IDX_cambio_precio_fecha\`
      ON \`cambio_precio\` (\`fecha\`)
    `);
    await queryRunner.query(`
      ALTER TABLE \`cambio_precio\`
      ADD CONSTRAINT \`FK_cambio_precio_producto\`
      FOREIGN KEY (\`producto_id\`) REFERENCES \`producto\`(\`id\`)
      ON DELETE CASCADE ON UPDATE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `cambio_precio` DROP FOREIGN KEY `FK_cambio_precio_producto`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_cambio_precio_producto_id` ON `cambio_precio`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_cambio_precio_fecha` ON `cambio_precio`',
    );
    await queryRunner.query('DROP TABLE `cambio_precio`');
  }
}
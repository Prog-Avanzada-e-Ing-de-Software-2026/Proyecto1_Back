import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveSuperLineaDenominacionUnique1789400000000
  implements MigrationInterface
{
  name = 'RemoveSuperLineaDenominacionUnique1789400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `super_linea` DROP INDEX `UQ_super_linea_denominacion`',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `super_linea` ADD CONSTRAINT `UQ_super_linea_denominacion` UNIQUE (`denominacion`)',
    );
  }
}

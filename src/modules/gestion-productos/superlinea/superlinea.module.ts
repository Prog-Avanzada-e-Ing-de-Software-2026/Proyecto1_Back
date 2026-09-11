import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NormalizeDenominacionPipe } from 'src/modules/common/pipes/normalize-denominations.pipe';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { TypeOrmUnitOfWork } from 'src/modules/common/unit-of-work/type-orm-unit-of-works1';
import { UsuarioModule } from 'src/modules/gestion-usuario/usuario/usuario.module';
import { DataSource } from 'typeorm';
import { LineaModule } from '../linea/linea.module';
import { SuperLineaController } from './application/controllers/superlinea.controller';
import { SuperLineaService } from './application/services/superlinea.service';
import { SuperLinea } from './domain/entities/superlinea.entity';
import { PoliticaEliminacionSuperLinea } from './domain/services/politica-eliminacion-superlinea.service';
import { SuperLineaPersistenceAdapter } from './infraestructure/repositories/superlinea.persistence-adapter';
import { SuperLineaRepository } from './infraestructure/repositories/superlinea.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([SuperLinea]),
    UsuarioModule,
    forwardRef(() => LineaModule),
  ],
  controllers: [SuperLineaController],
  providers: [
    SuperLineaService,
    PoliticaEliminacionSuperLinea,
    SuperLineaPersistenceAdapter,
    NormalizeDenominacionPipe,
    {
      provide: 'ISuperLineaRepository',
      useClass: SuperLineaRepository,
    },
    {
      provide: 'UnitOfWork',
      useFactory: (dataSource: DataSource): IUnitOfWork =>
        new TypeOrmUnitOfWork(dataSource),
      inject: [DataSource],
    },
  ],
  exports: [TypeOrmModule, SuperLineaService, 'ISuperLineaRepository'],
})
export class SuperLineaModule {}

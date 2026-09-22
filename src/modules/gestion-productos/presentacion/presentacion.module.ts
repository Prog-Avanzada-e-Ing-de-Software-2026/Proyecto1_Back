import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NormalizeDenominacionPipe } from 'src/modules/common/pipes/normalize-denominations.pipe';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { TypeOrmUnitOfWork } from 'src/modules/common/unit-of-work/type-orm-unit-of-works1';
import { UsuarioModule } from 'src/modules/gestion-usuario/usuario/usuario.module';
import { DataSource } from 'typeorm';
import { ProductoModule } from '../producto/producto.module';
import { PresentacionController } from './application/controllers/presentacion.controller';
import { PresentacionService } from './application/services/presentacion.service';
import { Presentacion } from './domain/entities/presentacion.entity';
import { PoliticaEliminacionPresentacion } from './domain/services/politica-eliminacion-presentacion.service';
import { PresentacionIntrinsicValidationService } from './domain/services/presentacion-intrinsic-validation.service';
import { PresentacionPersistenceAdapter } from './infraestructure/repositories/presentacion.persistence-adapter';
import { PresentacionRepository } from './infraestructure/repositories/presentacion.repository';
import {
  PoliticaCreacionPresentacion
} from 'src/modules/gestion-productos/presentacion/domain/services/politica-creacion-presentacion.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Presentacion]),
    UsuarioModule,
    forwardRef(() => ProductoModule),
  ],
  controllers: [PresentacionController],
  providers: [
    PresentacionService,
    PoliticaEliminacionPresentacion,
    PoliticaCreacionPresentacion,
    PresentacionIntrinsicValidationService,
    PresentacionPersistenceAdapter,
    NormalizeDenominacionPipe,
    {
      provide: 'IPresentacionRepository',
      useClass: PresentacionRepository,
    },
    {
      provide: 'UnitOfWork',
      useFactory: (dataSource: DataSource): IUnitOfWork =>
        new TypeOrmUnitOfWork(dataSource),
      inject: [DataSource],
    },
  ],
  exports: [TypeOrmModule, PresentacionService, 'IPresentacionRepository'],
})
export class PresentacionModule {}

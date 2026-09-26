import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional } from 'src/modules/common/decorators/transactional.decoratos';
import { BasePersistenceAdapter } from 'src/modules/common/persistence/base-persistence.adapter';
import { QueryBuilderHelper } from 'src/modules/common/query-builders/query-builder-helpers';
import { handleDatabaseError } from 'src/modules/common/query-builders/database-error.helper';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { FechaUtils } from 'src/modules/common/utils/date/fecha-utils';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { DataSource, IsNull, Repository, SelectQueryBuilder } from 'typeorm';
import { Presentacion } from '../../domain/entities/presentacion.entity';
import { IPresentacionRepository } from '../../domain/interfaces/presentacion.repository.interface';
import { CreatePresentacionDto } from '../../dto/create-presentacion.dto';
import { UpdatePresentacionDto } from '../../dto/update-presentacion.dto';
import {
  IPresentacionSearchQuery
} from 'src/modules/gestion-productos/presentacion/domain/interfaces/presentacion.search-query.interface';

@Injectable()
export class PresentacionPersistenceAdapter
  extends BasePersistenceAdapter<Presentacion>
  implements IPresentacionRepository
{
  protected readonly ALIAS = 'presentacion';
  private readonly logger = new Logger(PresentacionPersistenceAdapter.name);

  constructor(
    @InjectRepository(Presentacion) repository: Repository<Presentacion>,
    private readonly dataSource: DataSource,
    @Inject('UnitOfWork') public readonly uow: IUnitOfWork,
  ) {
    super(repository);
  }

  @Transactional()
  async create(data: CreatePresentacionDto): Promise<Presentacion> {
    const repository = this.uow.getRepository(Presentacion);
    return repository.save(repository.create(data));
  }

  @Transactional()
  async update(id: number, data: UpdatePresentacionDto): Promise<Presentacion> {
    const repository = this.uow.getRepository(Presentacion);
    const entity = await repository.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`Presentación con ID ${id} no encontrada.`);
    }
    repository.merge(entity, {
      denominacion: data.denominacion ?? entity.denominacion,
      observacion: data.observacion ?? entity.observacion,
      usuarioUpdatedId: data.usuarioUpdatedId,
    });
    return repository.save(entity);
  }

  async findOne(id: number): Promise<Presentacion | null> {
    try {
      return await this.repository.findOne({
        where: { id, deletedAt: IsNull() },
      });
    } catch (error) {
      handleDatabaseError(this.logger, 'findOne', error);
    }
  }

  async findByDenominacionWithDeleted(
    denominacion: string,
  ): Promise<Presentacion | null> {
    try {
      return await this.baseQueryWithDeleted()
        .where(`UPPER(${this.ALIAS}.denominacion) = :denominacion`, {
          denominacion: denominacion.trim().toUpperCase(),
        })
        .getOne();
    } catch (error) {
      handleDatabaseError(this.logger, 'findByDenominacionWithDeleted', error);
    }
  }

  async findBy({
    denominacion,
    skip,
    take,
    incluirEliminados,
  }: IPresentacionSearchQuery): Promise<{ data: Presentacion[]; total: number }> {
    try {
      const query = this.baseQuery(incluirEliminados);
      this.applyDenominacionFilter(query, denominacion);
      QueryBuilderHelper.applyOrder(query, this.ALIAS, 'denominacion', 'ASC');
      QueryBuilderHelper.applyPagination(query, skip, take);
      const [data, total] = await query.getManyAndCount();
      return { data, total };
    } catch (error) {
      handleDatabaseError(this.logger, 'findBy', error);
    }
  }

  async findAllFor(denominacion: string): Promise<Presentacion[]> {
    try {
      const query = this.baseQuery();
      this.applyDenominacionFilter(query, denominacion);
      QueryBuilderHelper.applyOrder(query, this.ALIAS, 'denominacion', 'ASC');
      return await query.getMany();
    } catch (error) {
      handleDatabaseError(this.logger, 'findAllFor', error);
    }
  }

  async findByIdConAuditoria(id: number): Promise<AuditoriaDto | null> {
    try {
      const raw = await this.repository
        .createQueryBuilder(this.ALIAS)
        .withDeleted()
        .leftJoin(
          'usuario',
          'usuarioCreated',
          `usuarioCreated.id = ${this.ALIAS}.usuarioCreatedId`,
        )
        .leftJoin(
          'usuario',
          'usuarioUpdated',
          `usuarioUpdated.id = ${this.ALIAS}.usuarioUpdatedId`,
        )
        .leftJoin(
          'usuario',
          'usuarioDeleted',
          `usuarioDeleted.id = ${this.ALIAS}.usuarioDeletedId`,
        )
        .select([
          `${this.ALIAS}.id AS id`,
          `${this.ALIAS}.denominacion AS denominacion`,
          `${this.ALIAS}.createdAt AS createdAt`,
          `${this.ALIAS}.updatedAt AS updatedAt`,
          `${this.ALIAS}.deletedAt AS deletedAt`,
          'usuarioCreated.denominacion AS usuarioCreated',
          'usuarioUpdated.denominacion AS usuarioUpdated',
          'usuarioDeleted.denominacion AS usuarioDeleted',
        ])
        .where(`${this.ALIAS}.id = :id`, { id })
        .getRawOne();
      if (!raw) return null;
      return {
        id: raw.id,
        detalle: `Presentación ${raw.denominacion}`,
        createdAt: raw.createdAt
          ? FechaUtils.formatFechaHora(raw.createdAt)
          : '',
        updatedAt: raw.updatedAt
          ? FechaUtils.formatFechaHora(raw.updatedAt)
          : '',
        deletedAt: raw.deletedAt
          ? FechaUtils.formatFechaHora(raw.deletedAt)
          : '',
        usuarioCreated: raw.usuarioCreated ?? '',
        usuarioUpdated: raw.usuarioUpdated ?? '',
        usuarioDeleted: raw.usuarioDeleted ?? '',
      };
    } catch (error) {
      handleDatabaseError(this.logger, 'findByIdConAuditoria', error);
    }
  }

  @Transactional()
  async remove(entity: Presentacion, usuario: Usuario): Promise<Presentacion> {
    const repository = this.uow.getRepository(Presentacion);
    entity.deletedAt = new Date();
    entity.usuarioDeletedId = usuario.id;
    return repository.save(entity);
  }

  private applyDenominacionFilter(
    query: SelectQueryBuilder<Presentacion>,
    denominacion: string,
  ) {
    if (denominacion) {
      query.andWhere(`UPPER(${this.ALIAS}.denominacion) LIKE :denominacion`, {
        denominacion: `%${denominacion.toUpperCase()}%`,
      });
    }
  }
}

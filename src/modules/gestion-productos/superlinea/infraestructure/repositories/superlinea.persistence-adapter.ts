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
import { SuperLinea } from '../../domain/entities/superlinea.entity';
import { ISuperLineaRepository } from '../../domain/interfaces/superlinea.repository.interface';
import { CreateSuperLineaDto } from '../../dto/create-superlinea.dto';
import { UpdateSuperLineaDto } from '../../dto/update-superlinea.dto';
import {
  ISuperLineaSearchQuery
} from 'src/modules/gestion-productos/superlinea/domain/interfaces/superlinea.search-query.interface';

@Injectable()
export class SuperLineaPersistenceAdapter
  extends BasePersistenceAdapter<SuperLinea>
  implements ISuperLineaRepository
{
  protected readonly ALIAS = 'superLinea';
  private readonly logger = new Logger(SuperLineaPersistenceAdapter.name);

  constructor(
    @InjectRepository(SuperLinea) repository: Repository<SuperLinea>,
    private readonly dataSource: DataSource,
    @Inject('UnitOfWork') public readonly uow: IUnitOfWork,
  ) {
    super(repository);
  }

  @Transactional()
  async create(data: CreateSuperLineaDto): Promise<SuperLinea> {
    const repository = this.uow.getRepository(SuperLinea);
    return repository.save(repository.create(data));
  }

  @Transactional()
  async update(id: number, data: UpdateSuperLineaDto): Promise<SuperLinea> {
    const repository = this.uow.getRepository(SuperLinea);
    const entity = await repository.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`SuperLínea con ID ${id} no encontrada.`);
    }
    repository.merge(entity, {
      denominacion: data.denominacion ?? entity.denominacion,
      observacion: data.observacion ?? entity.observacion,
      usuarioUpdatedId: data.usuarioUpdatedId,
    });
    return repository.save(entity);
  }

  async findOne(id: number): Promise<SuperLinea | null> {
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
  ): Promise<SuperLinea | null> {
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
  }: ISuperLineaSearchQuery): Promise<{ data: SuperLinea[]; total: number }> {
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

  async findAllFor(denominacion: string): Promise<SuperLinea[]> {
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
        detalle: `SuperLínea ${raw.denominacion}`,
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
  async remove(entity: SuperLinea, usuario: Usuario): Promise<SuperLinea> {
    const repository = this.uow.getRepository(SuperLinea);
    entity.deletedAt = new Date();
    entity.usuarioDeletedId = usuario.id;
    return repository.save(entity);
  }

  private applyDenominacionFilter(
    query: SelectQueryBuilder<SuperLinea>,
    denominacion: string,
  ) {
    if (denominacion) {
      query.andWhere(`UPPER(${this.ALIAS}.denominacion) LIKE :denominacion`, {
        denominacion: `%${denominacion.toUpperCase()}%`,
      });
    }
  }
}

import { Presentacion } from '../domain/entities/presentacion.entity';
import { PresentacionDto } from '../dto/presentacion.dto';
import { PaginationWithDenominacionDto } from 'src/modules/common/dto/busquedas/pagination-with-denominacion.dto';
import {
  IPresentacionSearchQuery
} from 'src/modules/gestion-productos/presentacion/domain/interfaces/presentacion.search-query.interface';

export class PresentacionMapper {
  static toDto(entity: Presentacion): PresentacionDto {
    return {
      id: entity.id,
      denominacion: entity.denominacion,
      observacion: entity.observacion ?? '',
      deletedAt: entity.deletedAt?.toISOString() ?? null,
    };
  }

  static toPaginationQuery(
    dto: PaginationWithDenominacionDto,
  ): IPresentacionSearchQuery {
    return {
      denominacion: dto.denominacion ?? '',
      skip: dto.skip,
      take: dto.take,
      incluirEliminados: dto.incluirEliminados ?? false,
    };
  }
}

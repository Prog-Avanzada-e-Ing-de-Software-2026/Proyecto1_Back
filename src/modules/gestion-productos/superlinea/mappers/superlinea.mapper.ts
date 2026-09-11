import { SuperLinea } from '../domain/entities/superlinea.entity';
import { SuperLineaDto } from '../dto/superlinea.dto';
import { PaginationWithDenominacionDto } from 'src/modules/common/dto/busquedas/pagination-with-denominacion.dto';
import {
  ISuperLineaSearchQuery
} from 'src/modules/gestion-productos/superlinea/domain/interfaces/superlinea.search-query.interface';

export class SuperLineaMapper {
  static toDto(entity: SuperLinea): SuperLineaDto {
    return {
      id: entity.id,
      denominacion: entity.denominacion,
      observacion: entity.observacion ?? '',
      deletedAt: entity.deletedAt?.toISOString() ?? null,
    };
  }

  static toPaginationQuery(
    dto: PaginationWithDenominacionDto,
  ): ISuperLineaSearchQuery {
    return {
      denominacion: dto.denominacion ?? '',
      skip: dto.skip,
      take: dto.take,
      incluirEliminados: dto.incluirEliminados ?? false,
    };
  }
}

import { SuperLinea } from '../domain/entities/superlinea.entity';
import { SuperLineaDto } from '../dto/superlinea.dto';

export class SuperLineaMapper {
  static toDto(entity: SuperLinea): SuperLineaDto {
    return {
      id: entity.id,
      denominacion: entity.denominacion,
      observacion: entity.observacion ?? '',
      deletedAt: entity.deletedAt?.toISOString() ?? null,
    };
  }
}

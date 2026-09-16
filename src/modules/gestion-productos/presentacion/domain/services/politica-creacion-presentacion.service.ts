import { Inject } from '@nestjs/common';
import {
  IPresentacionRepository
} from 'src/modules/gestion-productos/presentacion/domain/interfaces/presentacion.repository.interface';

export class PoliticaCreacionPresentacion {
  constructor(
    @Inject('IPresentacionRepository')
    private readonly presentacionRepository: IPresentacionRepository,
  ) {}

  async checkDenominacionExists(
    denominacion: string,
    excludeId?: number,
  ): Promise<boolean> {
    const existing =
      await this.presentacionRepository.findByDenominacionWithDeleted(
        denominacion,
      );
    if (!existing) {
      return false;
    }
    return excludeId === undefined || existing.id !== excludeId;
  }
}
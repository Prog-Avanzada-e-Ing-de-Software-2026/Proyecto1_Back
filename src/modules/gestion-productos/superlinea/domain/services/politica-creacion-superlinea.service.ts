import { Inject } from '@nestjs/common';
import {
  ISuperLineaRepository
} from 'src/modules/gestion-productos/superlinea/domain/interfaces/superlinea.repository.interface';

export class PoliticaCreacionSuperLinea {
  constructor(
    @Inject('ISuperLineaRepository')
    private readonly superLineaRepository: ISuperLineaRepository,
  ) {}

  async checkDenominacionExists(denominacion: string): Promise<boolean> {
    const existing = await this.superLineaRepository.findByDenominacionWithDeleted(denominacion);
    return !!existing;
  }
}
import { Inject, Injectable } from '@nestjs/common';
import { ILineaRepository } from '../../../linea/domain/interfaces/linea.repository.interface';

@Injectable()
export class PoliticaEliminacionSuperLinea {
  constructor(
    @Inject('ILineaRepository')
    private readonly lineaRepository: ILineaRepository,
  ) {}

  tieneLineasActivas(superLineaId: number): Promise<boolean> {
    return this.lineaRepository.existsActiveBySuperLinea(superLineaId);
  }
}

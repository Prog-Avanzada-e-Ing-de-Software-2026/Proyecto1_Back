import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { CreateSuperLineaDto } from '../../dto/create-superlinea.dto';
import { UpdateSuperLineaDto } from '../../dto/update-superlinea.dto';
import { SuperLinea } from '../entities/superlinea.entity';
import {
  ISuperLineaSearchQuery
} from 'src/modules/gestion-productos/superlinea/domain/interfaces/superlinea.search-query.interface';

export interface ISuperLineaRepository {
  create(data: CreateSuperLineaDto): Promise<SuperLinea>;
  update(id: number, data: UpdateSuperLineaDto): Promise<SuperLinea>;
  findOne(id: number): Promise<SuperLinea | null>;
  findByDenominacionWithDeleted(
    denominacion: string,
  ): Promise<SuperLinea | null>;
  findBy(query: ISuperLineaSearchQuery): Promise<{ data: SuperLinea[]; total: number }>;
  findAllFor(denominacion: string): Promise<SuperLinea[]>;
  findByIdConAuditoria(id: number): Promise<AuditoriaDto | null>;
  remove(data: SuperLinea, usuario: Usuario): Promise<SuperLinea>;
}

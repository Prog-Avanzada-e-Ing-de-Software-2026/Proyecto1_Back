import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { CreateSuperLineaDto } from '../../dto/create-superlinea.dto';
import { UpdateSuperLineaDto } from '../../dto/update-superlinea.dto';
import { SuperLinea } from '../entities/superlinea.entity';

export interface ISuperLineaRepository {
  create(data: CreateSuperLineaDto): Promise<SuperLinea>;
  update(id: number, data: UpdateSuperLineaDto): Promise<SuperLinea>;
  findOne(id: number): Promise<SuperLinea | null>;
  findByDenominacionWithDeleted(
    denominacion: string,
  ): Promise<SuperLinea | null>;
  findBy(
    denominacion: string,
    skip: number,
    take: number,
    incluirEliminados: boolean,
  ): Promise<{ data: SuperLinea[]; total: number }>;
  findAllFor(denominacion: string): Promise<SuperLinea[]>;
  findByIdConAuditoria(id: number): Promise<AuditoriaDto | null>;
  remove(data: SuperLinea, usuario: Usuario): Promise<SuperLinea>;
}

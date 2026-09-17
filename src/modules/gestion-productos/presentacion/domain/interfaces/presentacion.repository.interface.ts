import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { CreatePresentacionDto } from '../../dto/create-presentacion.dto';
import { UpdatePresentacionDto } from '../../dto/update-presentacion.dto';
import { Presentacion } from '../entities/presentacion.entity';
import {
  IPresentacionSearchQuery
} from 'src/modules/gestion-productos/presentacion/domain/interfaces/presentacion.search-query.interface';

export interface IPresentacionRepository {
  create(data: CreatePresentacionDto): Promise<Presentacion>;
  update(id: number, data: UpdatePresentacionDto): Promise<Presentacion>;
  findOne(id: number): Promise<Presentacion | null>;
  findByDenominacionWithDeleted(
    denominacion: string,
  ): Promise<Presentacion | null>;
  findBy(query: IPresentacionSearchQuery): Promise<{ data: Presentacion[]; total: number }>;
  findAllFor(denominacion: string): Promise<Presentacion[]>;
  findByIdConAuditoria(id: number): Promise<AuditoriaDto | null>;
  remove(data: Presentacion, usuario: Usuario): Promise<Presentacion>;
}

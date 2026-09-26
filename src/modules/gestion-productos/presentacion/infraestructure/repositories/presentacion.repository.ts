import { Injectable } from '@nestjs/common';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { Presentacion } from '../../domain/entities/presentacion.entity';
import { IPresentacionRepository } from '../../domain/interfaces/presentacion.repository.interface';
import { CreatePresentacionDto } from '../../dto/create-presentacion.dto';
import { UpdatePresentacionDto } from '../../dto/update-presentacion.dto';
import { PresentacionPersistenceAdapter } from './presentacion.persistence-adapter';
import {
  IPresentacionSearchQuery
} from 'src/modules/gestion-productos/presentacion/domain/interfaces/presentacion.search-query.interface';

@Injectable()
export class PresentacionRepository implements IPresentacionRepository {
  constructor(private readonly persistence: PresentacionPersistenceAdapter) {}

  create(data: CreatePresentacionDto) {
    return this.persistence.create(data);
  }

  update(id: number, data: UpdatePresentacionDto) {
    return this.persistence.update(id, data);
  }

  findOne(id: number) {
    return this.persistence.findOne(id);
  }

  findByDenominacionWithDeleted(denominacion: string) {
    return this.persistence.findByDenominacionWithDeleted(denominacion);
  }

  findBy(query: IPresentacionSearchQuery) {
    return this.persistence.findBy(query);
  }

  findAllFor(denominacion: string) {
    return this.persistence.findAllFor(denominacion);
  }

  findByIdConAuditoria(id: number): Promise<AuditoriaDto | null> {
    return this.persistence.findByIdConAuditoria(id);
  }

  remove(data: Presentacion, usuario: Usuario) {
    return this.persistence.remove(data, usuario);
  }
}

import { Injectable } from '@nestjs/common';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { SuperLinea } from '../../domain/entities/superlinea.entity';
import { ISuperLineaRepository } from '../../domain/interfaces/superlinea.repository.interface';
import { CreateSuperLineaDto } from '../../dto/create-superlinea.dto';
import { UpdateSuperLineaDto } from '../../dto/update-superlinea.dto';
import { SuperLineaPersistenceAdapter } from './superlinea.persistence-adapter';

@Injectable()
export class SuperLineaRepository implements ISuperLineaRepository {
  constructor(private readonly persistence: SuperLineaPersistenceAdapter) {}

  create(data: CreateSuperLineaDto) {
    return this.persistence.create(data);
  }

  update(id: number, data: UpdateSuperLineaDto) {
    return this.persistence.update(id, data);
  }

  findOne(id: number) {
    return this.persistence.findOne(id);
  }

  findByDenominacionWithDeleted(denominacion: string) {
    return this.persistence.findByDenominacionWithDeleted(denominacion);
  }

  findBy(
    denominacion: string,
    skip: number,
    take: number,
    incluirEliminados: boolean,
  ) {
    return this.persistence.findBy(
      denominacion,
      skip,
      take,
      incluirEliminados,
    );
  }

  findAllFor(denominacion: string) {
    return this.persistence.findAllFor(denominacion);
  }

  findByIdConAuditoria(id: number): Promise<AuditoriaDto | null> {
    return this.persistence.findByIdConAuditoria(id);
  }

  remove(data: SuperLinea, usuario: Usuario) {
    return this.persistence.remove(data, usuario);
  }
}

import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { CreateLineaDto } from '../../dto/create-linea.dto';
import { UpdateLineaDto } from '../../dto/update-linea.dto';
import { Linea } from '../entities/linea.entity';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { SuperLinea } from '../../../superlinea/domain/entities/superlinea.entity';

export interface ILineaRepository {

  create(data: CreateLineaDto, superLinea: SuperLinea): Promise<Linea>;
  findAllFor(denominacion: string): Promise<Linea[]>;
  findAllListado(): Promise<Linea[]>;
  findAllSinSistemaFor(denominacion: string): Promise<Linea[]>;
  existsActiveBySuperLinea(superLineaId: number): Promise<boolean>;
  findOne(id: number): Promise<Linea | null>;
  findByDenominacion(denominacion: string): Promise<Linea | null>;
  findByDenominacionWith(denominacion: string): Promise<Linea | null>;
  findByDenominacionFiltered(
    denominacion: string,
    skip: number,
    take: number,
    incluirEliminados: boolean
  ): Promise<{ data: Linea[]; total: number } >;

  findByIdConAuditoria(id: number):  Promise<AuditoriaDto | null> ;
  update(
    id: number,
    data: UpdateLineaDto,
    superLinea?: SuperLinea,
  ): Promise<Linea>;
  remove(data: Linea,usuario:Usuario): Promise<Linea>;
}

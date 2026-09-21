import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MessageFrontUtils } from 'src/modules/common/utils/message/message-front.util';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { IPresentacionRepository } from '../../domain/interfaces/presentacion.repository.interface';
import { PoliticaEliminacionPresentacion } from '../../domain/services/politica-eliminacion-presentacion.service';
import { CreatePresentacionDto } from '../../dto/create-presentacion.dto';
import { PresentacionDto } from '../../dto/presentacion.dto';
import { UpdatePresentacionDto } from '../../dto/update-presentacion.dto';
import { PresentacionMapper } from '../../mappers/presentacion.mapper';
import {
  PoliticaCreacionPresentacion
} from 'src/modules/gestion-productos/presentacion/domain/services/politica-creacion-presentacion.service';
import { PaginationWithDenominacionDto } from 'src/modules/common/dto/busquedas/pagination-with-denominacion.dto';

@Injectable()
export class PresentacionService {
  private readonly logger = new Logger(PresentacionService.name);
  private readonly ENTITY_NAME = 'Presentación';

  constructor(
    @Inject('IPresentacionRepository')
    private readonly repository: IPresentacionRepository,
    private readonly usuarioService: UsuarioService,
    private readonly deletionPolicy: PoliticaEliminacionPresentacion,
    private readonly createPolicy: PoliticaCreacionPresentacion,
  ) {}

  async create(dto: CreatePresentacionDto) {
    await this.checkDenominacionExists(dto.denominacion);
    await this.repository.create(dto);
    return MessageFrontUtils.createSimple(
      this.ENTITY_NAME,
      dto.denominacion,
      'creada',
    );
  }

  async update(id: number, dto: UpdatePresentacionDto) {
    await this.findEntityById(id);
    if (dto.denominacion) {
      await this.checkDenominacionExists(dto.denominacion, id);
    }
    const entity = await this.repository.update(id, dto);
    return MessageFrontUtils.createSimple(
      this.ENTITY_NAME,
      entity.denominacion,
      'editada',
    );
  }

  async findBy(dto: PaginationWithDenominacionDto,): Promise<{ data: PresentacionDto[]; total: number }> {
    const query = PresentacionMapper.toPaginationQuery(dto);
    const result = await this.repository.findBy(query);
    return {
      data: result.data.map(PresentacionMapper.toDto),
      total: result.total,
    };
  }

  async findAllFor(
    denominacion: string,
  ): Promise<{ data: PresentacionDto[]; total: number }> {
    const entities = await this.repository.findAllFor(denominacion);
    const data = entities.map(PresentacionMapper.toDto);
    return { data, total: data.length };
  }

  async findDtoById(id: number): Promise<PresentacionDto> {
    return PresentacionMapper.toDto(await this.findEntityById(id));
  }

  async findEntityById(id: number) {
    const entity = await this.repository.findOne(id);
    if (!entity) {
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrada.`,
      );
    }
    return entity;
  }

  async findByIdConAuditoria(id: number) {
    const audit = await this.repository.findByIdConAuditoria(id);
    if (!audit) {
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrada.`,
      );
    }
    return audit;
  }

  async remove(id: number, usuarioId: number) {
    const entity = await this.findEntityById(id);
    if (await this.deletionPolicy.tieneProductosActivos(id)) {
      throw new ConflictException(
        'No se puede eliminar la presentación porque está asociada a productos activos.',
      );
    }
    const usuario = await this.usuarioService.findOne(usuarioId);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado.`);
    }
    await this.repository.remove(entity, usuario);
    return MessageFrontUtils.createSimple(
      this.ENTITY_NAME,
      entity.denominacion,
      'eliminada',
    );
  }

  private async checkDenominacionExists(
    denominacion: string,
    excludeId?: number,
  ) {
    const exists = await this.createPolicy.checkDenominacionExists(
      denominacion,
      excludeId,
    );
    if (exists) {
      this.logger.warn(
        `${this.ENTITY_NAME} conflicto: denominación ya está en uso: ${denominacion}`,
      );
      throw new ConflictException('Denominación ya en uso.');
    }
  }
}

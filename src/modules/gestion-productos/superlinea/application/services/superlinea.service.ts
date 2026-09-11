import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MessageFrontUtils } from 'src/modules/common/utils/message/message-front.util';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { ISuperLineaRepository } from '../../domain/interfaces/superlinea.repository.interface';
import { PoliticaEliminacionSuperLinea } from '../../domain/services/politica-eliminacion-superlinea.service';
import { CreateSuperLineaDto } from '../../dto/create-superlinea.dto';
import { SuperLineaDto } from '../../dto/superlinea.dto';
import { UpdateSuperLineaDto } from '../../dto/update-superlinea.dto';
import { SuperLineaMapper } from '../../mappers/superlinea.mapper';

@Injectable()
export class SuperLineaService {
  private readonly logger = new Logger(SuperLineaService.name);
  private readonly ENTITY_NAME = 'SuperLínea';

  constructor(
    @Inject('ISuperLineaRepository')
    private readonly repository: ISuperLineaRepository,
    private readonly usuarioService: UsuarioService,
    private readonly deletionPolicy: PoliticaEliminacionSuperLinea,
  ) {}

  async create(dto: CreateSuperLineaDto) {
    await this.checkDenominacionExists(dto.denominacion, 0);
    await this.repository.create(dto);
    return MessageFrontUtils.createSimple(
      this.ENTITY_NAME,
      dto.denominacion,
      'creada',
    );
  }

  async update(id: number, dto: UpdateSuperLineaDto) {
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

  async findBy(
    denominacion: string,
    skip = 0,
    take = 10,
    incluirEliminados = false,
  ): Promise<{ data: SuperLineaDto[]; total: number }> {
    const result = await this.repository.findBy(
      denominacion,
      skip,
      take,
      incluirEliminados,
    );
    return {
      data: result.data.map(SuperLineaMapper.toDto),
      total: result.total,
    };
  }

  async findAllFor(
    denominacion: string,
  ): Promise<{ data: SuperLineaDto[]; total: number }> {
    const entities = await this.repository.findAllFor(denominacion);
    const data = entities.map(SuperLineaMapper.toDto);
    return { data, total: data.length };
  }

  async findDtoById(id: number): Promise<SuperLineaDto> {
    return SuperLineaMapper.toDto(await this.findEntityById(id));
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
    if (await this.deletionPolicy.tieneLineasActivas(id)) {
      throw new ConflictException(
        'No se puede eliminar la superlínea porque está asociada a líneas activas.',
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

  private async checkDenominacionExists(denominacion: string, id: number) {
    const existing =
      await this.repository.findByDenominacionWithDeleted(denominacion);
    if (existing && existing.id !== id) {
      this.logger.warn(
        `${this.ENTITY_NAME} conflicto: denominación ya está en uso: ${denominacion}`,
      );
      throw new ConflictException('Denominación ya en uso.');
    }
  }
}

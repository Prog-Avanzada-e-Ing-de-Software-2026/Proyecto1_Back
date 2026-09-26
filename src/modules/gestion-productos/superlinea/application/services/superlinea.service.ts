import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { SelectOption } from 'src/modules/common/interface/select-option';
import { MessageFrontUtils } from 'src/modules/common/utils/message/message-front.util';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { ISuperLineaRepository } from '../../domain/interfaces/superlinea.repository.interface';
import { PoliticaEliminacionSuperLinea } from '../../domain/services/politica-eliminacion-superlinea.service';
import { CreateSuperLineaDto } from '../../dto/create-superlinea.dto';
import { SuperLineaDto } from '../../dto/superlinea.dto';
import { UpdateSuperLineaDto } from '../../dto/update-superlinea.dto';
import { SuperLineaMapper } from '../../mappers/superlinea.mapper';
import {
  PoliticaCreacionSuperLinea
} from 'src/modules/gestion-productos/superlinea/domain/services/politica-creacion-superlinea.service';
import { SuperLineaIntrinsicValidationService } from '../../domain/services/superlinea-intrinsic-validation.service';
import { PaginationWithDenominacionDto } from 'src/modules/common/dto/busquedas/pagination-with-denominacion.dto';

@Injectable()
export class SuperLineaService {
  private readonly logger = new Logger(SuperLineaService.name);
  private readonly ENTITY_NAME = 'SuperLínea';

  constructor(
    @Inject('ISuperLineaRepository')
    private readonly repository: ISuperLineaRepository,
    private readonly usuarioService: UsuarioService,
    private readonly deletionPolicy: PoliticaEliminacionSuperLinea,
    private readonly createPolicy: PoliticaCreacionSuperLinea,

    @Optional()
    private readonly superLineaValidationService: SuperLineaIntrinsicValidationService = new SuperLineaIntrinsicValidationService(),
  ) {}

  async create(dto: CreateSuperLineaDto) {
    this.superLineaValidationService.validarDatosBasicos(dto, {
      requerirEstadoCompleto: true,
    });

    await this.checkDenominacionExists(dto.denominacion);
    await this.repository.create(dto);
    return MessageFrontUtils.createSimple(
      this.ENTITY_NAME,
      dto.denominacion,
      'creada',
    );
  }

  async update(id: number, dto: UpdateSuperLineaDto) {
    this.superLineaValidationService.validarDatosBasicos(dto);

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

  async findBy(dto: PaginationWithDenominacionDto,): Promise<{ data: SuperLineaDto[]; total: number }> {
    const query = SuperLineaMapper.toPaginationQuery(dto);
    const result = await this.repository.findBy(query);
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

  async busquedaPorCoincidenciaParcial(
    denominacion: string,
  ): Promise<SelectOption[]> {
    const superLineas =
      await this.repository.busquedaPorCoincidenciaParcial(denominacion);
    return superLineas.map(SuperLineaMapper.toSelectOption);
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

  private async checkDenominacionExists(denominacion: string, id?: number) {
    const exists =
      await this.createPolicy.checkDenominacionExists(denominacion, id);
    if (exists) {
      this.logger.warn(
        `${this.ENTITY_NAME} conflicto: denominación ya está en uso: ${denominacion}`,
      );
      throw new ConflictException('Denominación ya en uso.');
    }
  }
}

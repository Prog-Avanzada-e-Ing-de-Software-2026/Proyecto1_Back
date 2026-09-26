import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { ensureNotSistemaEntity } from 'src/modules/common/utils/atrituto-sistema';
import { PaginacionUtils } from 'src/modules/common/utils/pagination/paginacion-utils';
import { MessageFrontUtils } from 'src/modules/common/utils/message/message-front.util';
import { SelectOption } from 'src/modules/common/interface/select-option';
import { ILineaRepository } from '../../domain/interfaces/linea.repository.interface';
import { CreateLineaDto } from '../../dto/create-linea.dto';
import { UpdateLineaDto } from '../../dto/update-linea.dto';
import { LineaDto } from '../../dto/linea.dto';
import { LineaMapper } from '../../mappers/linea.mapper';
import { PoliticaEliminacionLinea } from '../../domain/services/politica-eliminacion-linea.service';
import { LineaIntrinsicValidationService } from '../../domain/services/linea-intrinsic-validation.service';
import { Linea } from '../../domain/entities/linea.entity';
import { ISuperLineaRepository } from '../../../superlinea/domain/interfaces/superlinea.repository.interface';
import { SuperLinea } from 'src/modules/gestion-productos/superlinea/domain/entities/superlinea.entity';

@Injectable()
export class LineaService {
  private readonly logger = new Logger(LineaService.name);
  constructor(
    @Inject('ILineaRepository')
    private readonly repository: ILineaRepository,

    @Inject(forwardRef(() => PoliticaEliminacionLinea))
    private readonly validacionesService: PoliticaEliminacionLinea,
    private readonly usuarioService: UsuarioService,
    @Inject('ISuperLineaRepository')
    private readonly superLineaRepository: ISuperLineaRepository,

    @Optional()
    private readonly lineaValidationService: LineaIntrinsicValidationService = new LineaIntrinsicValidationService(),
  ) { }

  private readonly ENTITY_NAME = 'Linea';

  async create(dto: CreateLineaDto) {
    this.logger.log(
      `Creando un nuevo ${this.ENTITY_NAME} con denominación: ${dto.denominacion} a: ${dto.denominacion}`,
    );

    this.lineaValidationService.validarDatosBasicos(dto, {
      requerirEstadoCompleto: true,
    });

    await this.checkDenominacionExists(dto.denominacion, 0);
    const superLinea = await this.findActiveSuperLinea(dto.superLineaId);
    const entity = await this.repository.create(dto, superLinea);
    return LineaMapper.toDto(entity);
  }

  async update(id: number, dto: UpdateLineaDto) {
    this.logger.log(`Actualizando  ${this.ENTITY_NAME} con ID: ${id}`);

    this.lineaValidationService.validarDatosBasicos(dto);

    const linea = await this.findEntityById(id); // Verifica existencia
    ensureNotSistemaEntity(linea, 'Linea');
    if (dto.denominacion)
      await this.checkDenominacionExists(dto.denominacion, id);


    const superLinea =
      dto.superLineaId === undefined
        ? undefined
        : await this.findActiveSuperLinea(dto.superLineaId);
    const entity = await this.repository.update(id, dto, superLinea);
    return MessageFrontUtils.createSimple(
      `${this.ENTITY_NAME}`,
      entity.denominacion,
      'editada',
    );
  }

  async findByDenominacionFiltered(
    denominacion: string,
    skip = 0,
    take = 10,
    incluirEliminados: boolean = false,
  ): Promise<{ data: LineaDto[]; total: number }> {
    this.logger.log(
      ` ser Buscando o ${denominacion}  skip=${skip}, take=${take}`,
    );
    const result = await this.repository.findByDenominacionFiltered(
      denominacion,
      skip,
      take,
      incluirEliminados,
    );
    const data: LineaDto[] = result.data.map((linea) =>
      LineaMapper.toDto(linea),
    );
    return {
      data,
      total: PaginacionUtils.totalItems(result.total),
    };
  }

  async findAllFor(
    denominacion: string,
  ): Promise<{ data: LineaDto[]; total: number }> {
    const result = await this.repository.findAllFor(denominacion);

    this.logger.log(
      ` ser Buscando o ${denominacion}    result.length=${result.length}}`,
    );

    const data: LineaDto[] = result.map((linea) => LineaMapper.toDto(linea));

    return {
      data,
      total: 1,
    };
  }

  async findAllForSuperLineas(denominacion: string): Promise<SuperLinea[]> {
    return await this.superLineaRepository.findAllFor(denominacion);
  }

  async busquedaPorCoincidenciaParcial(
    denominacion: string,
  ): Promise<SelectOption[]> {
    const lineas =
      await this.repository.busquedaPorCoincidenciaParcial(denominacion);
    return lineas.map(LineaMapper.toSelectOption);
  }

  async findByIdConAuditoria(id: number) {
    const entity = await this.repository.findByIdConAuditoria(id);
    if (!entity)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    this.logger.warn(`FindOne : ${JSON.stringify(entity)}.`);

    return entity;
  }

  async findDtoById(id: number) {
    const entity = await this.repository.findOne(id);
    if (!entity)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    return LineaMapper.toDto(entity);
  }

  async findEntityById(id: number) {
    const entity = await this.repository.findOne(id);
    if (!entity)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    return entity;
  }

  async remove(id: number, usuarioId: number) {
    const entity = await this.repository.findOne(id);

    if (!entity) {
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    }

    ensureNotSistemaEntity(entity, 'Linea');

    const usuario = await this.usuarioService.findOne(usuarioId);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado.`);
    }

    const tieneProductosActivos =
      await this.validacionesService.tieneProductosActivosParaLinea(id);

    if (tieneProductosActivos) {
      throw new ConflictException(
        'No se puede eliminar la marca porque está asociada a productos activos.',
      );
    }

    await this.repository.remove(entity, usuario);
    return MessageFrontUtils.createSimple(
      `${this.ENTITY_NAME}`,
      entity.denominacion,
      'eliminada',
    );
  }

  private async checkDenominacionExists(denominacion: string, id: number) {
    const denominacionNormalizada = denominacion.trim().toUpperCase();

    this.logger.log(
      ` Verificando denominación: "${denominacionNormalizada}" para ID: ${id}`,
    );

    const exists = await this.repository.findByDenominacionWith(
      denominacionNormalizada,
    );

    this.logger.log(
      `Resultado: ${exists ? `Encontrado ID ${exists.id}` : 'No encontrado'}`,
    );

    if (exists && exists.id !== id) {
      this.logger.warn(
        ` Conflicto: denominación ya está en uso: ${denominacionNormalizada} (ID existente: ${exists.id})`,
      );
      throw new ConflictException('Denominación ya en uso o esta eliminada.');
    }

    this.logger.log(`✅ Denominación disponible`);
  }

  private async findActiveSuperLinea(id: number) {
    const superLinea = await this.superLineaRepository.findOne(id);
    if (!superLinea) {
      throw new NotFoundException(
        `SuperLínea con ID ${id} no encontrada o eliminada.`,
      );
    }
    return superLinea;
  }


  async findAllListado(): Promise<Linea[]> {
    const result = await this.repository.findAllListado();
    return result;
  }

}

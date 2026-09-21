import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { ProveedorService } from 'src/modules/organizacion/proveedor/application/services/proveedor.service';
import { PaginacionUtils } from 'src/modules/common/utils/pagination/paginacion-utils';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { ensureNotSistemaEntity } from 'src/modules/common/utils/atrituto-sistema';
import { AuditoriaMapper } from 'src/modules/gestion-sistema/auditoria/mappers/auditoria.mapper';
import { MessageFrontUtils } from 'src/modules/common/utils/message/message-front.util';
import { Producto } from '../../domain/entities/producto.entity';
import { IProductoRepository } from '../../domain/interfaces/producto.repository-interface';
import { CreateProductoDto } from '../../dto/create-producto.dto';
import { GetProductoDto } from '../../dto/get-producto.dto';
import { UpdateProductoDto } from '../../dto/update-producto.dto';
import { ProductoMapper } from '../../mappers/producto.mapper';
import { LineaService } from 'src/modules/gestion-productos/linea/application/services/linea.service';
import { MarcaService } from 'src/modules/gestion-productos/marca/application/services/marca.service';
import { ProductoIntrinsicValidationService } from '../../domain/services/producto-intrinsic-validation.service.ts';
import { ProductoValidationService } from '../../domain/services/producto-validation.service.ts';
import { ProductoRelatedEntitiesValidator } from '../../infraestructure/validators/producto-related-entities.validator.ts';
import { ProductoUniquenessValidator } from '../../infraestructure/validators/producto-uniqueness.validator.ts';
import { UsuarioValidator } from 'src/modules/common/utils/validation/usuario-validator';
import { ProductoDeletePolicy } from '../policies/producto-delete.policy';
import { ActualizacionPrecioDto } from '../../dto/actualizacion-precio.dto';
import { TipoAumento } from 'src/modules/common/enums/tipo-aumento.emun';
import { OperacionAjuste } from 'src/modules/common/enums/operacion-ajuste.enum';
import { BadRequestException } from '@nestjs/common';
import { IPresentacionRepository } from 'src/modules/gestion-productos/presentacion/domain/interfaces/presentacion.repository.interface';
import { Presentacion } from 'src/modules/gestion-productos/presentacion/domain/entities/presentacion.entity';
import { MotivoCambioPrecio } from '../../enums/motivo-cambio-precio.enum';
import { PaginationDto } from 'src/modules/common/dto/pagination.dto';
import { CambioPrecioDto } from '../../dto/cambio-precio.dto';
import { CambioPrecioMapper } from '../../mappers/cambio-precio.mapper';
@Injectable()
export class ProductoService {
  private readonly logger = new Logger(ProductoService.name);
  constructor(
    @Inject('IProductoRepository')
    private readonly repository: IProductoRepository,
    private readonly lineaService: LineaService,

    @Inject(forwardRef(() => MarcaService))
    private readonly marcaService: MarcaService,
    private readonly proveedorService: ProveedorService,
    private readonly usuarioService: UsuarioService,

    //  Domain Services
    private readonly intrinsicValidationService: ProductoIntrinsicValidationService,
    private readonly validationService: ProductoValidationService,

    // Infrastructure Validators
    private readonly relatedEntitiesValidator: ProductoRelatedEntitiesValidator,
    private readonly uniquenessValidator: ProductoUniquenessValidator,
    private readonly usuarioValidator: UsuarioValidator,

    private readonly productoDeletePolicy: ProductoDeletePolicy,

    @Inject('IPresentacionRepository')
    private readonly presentacionRepository: IPresentacionRepository,
  ) { }

  private readonly ENTITY_NAME = 'Producto';

  async create(dto: CreateProductoDto) {
    this.logger.log(
      `Creando un nuevo ${this.ENTITY_NAME} con denominación: ${dto.denominacion} a: ${dto.denominacion}`,
    );

    // Orquestar todas las validaciones
    const { marca, linea, usuario } =
      await this.validarYPrepararCreacion(dto);

    const presentacion = await this.findActivePresentacion(dto.presentacionId);

    const entity = await this.repository.create(
      dto,
      linea,
      marca,
      presentacion,
      usuario,
    );

    return MessageFrontUtils.createSimple(
      `${this.ENTITY_NAME}`,
      entity.denominacion,
      'creada',
    );
  }

  async update(id: number, dto: UpdateProductoDto) {
    this.logger.log(`Actualizandox  ${this.ENTITY_NAME} con ID: ${id}`);

    const { marca, linea, usuario } =
      await this.validarYPrepararActualizacion(id, dto);

    const presentacion =
      dto.presentacionId === undefined
        ? undefined
        : await this.findActivePresentacion(dto.presentacionId);

    const entity = await this.repository.update(
      id,
      dto,
      linea,
      marca,
      presentacion,
      usuario,
    );

    return MessageFrontUtils.createSimple(
      `${this.ENTITY_NAME}`,
      entity.denominacion,
      'editada',
    );
  }

  async findByRapido(
    codigo: string,
    exacto: boolean,
    skip: number,
    take: number,
  ): Promise<{ data: GetProductoDto[]; total: number }> {
    this.logger.warn(`service`);
    const result = await this.repository.findByRapido(
      codigo,
      exacto,
      skip,
      take,
    );
    return {
      data: result.data.map((producto) => {
        return ProductoMapper.toBusquedaDto(producto);
      }),
      total: PaginacionUtils.totalItems(result.total),
    };
  }


  async findBy(
    denominacion: string,
    codigoProveedor: string,
    codProveedorExacto: boolean,
    codigoReferencia: string,
    marca_id: number,
    linea_id: number,
    proveedor_id: number,
    conStock: boolean,
    skip: number,
    take: number,
  ): Promise<{ data: GetProductoDto[]; total: number }> {
    this.logger.warn(`service`);
    const result = await this.repository.findBy(
      denominacion,
      codigoProveedor,
      codProveedorExacto,
      codigoReferencia,
      marca_id,
      linea_id,
      proveedor_id,
      conStock,
      skip,
      take,
    );
    return {
      data: result.data.map((producto) => {
        return ProductoMapper.toBusquedaDto(producto);
      }),
      total: PaginacionUtils.totalItems(result.total),
    };
  }


  async buscarMarcaDesdeProducto(id: number) {
    return this.marcaService.findEntityById(id);
  }

  async buscarLineaDesdeProducto(id: number) {
    return this.lineaService.findEntityById(id);
  }

  async findByIdConAuditoria(id: number) {
    const entity = await this.repository.findByIdConAuditoria(id);
    if (!entity)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    return AuditoriaMapper.mapProductoToDto(entity);
  }

  async findDtoById(id: number) {
    const entity = await this.repository.findOne(id);
    if (!entity)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    this.logger.log(`b1x`);
    return ProductoMapper.toDto(entity);
  }

  async findEntityById(id: number) {
    const entity = await this.repository.findOne(id);
    if (!entity)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    return entity;
  }

  async getHistorialPrecios(
    id: number,
    paginacion: PaginationDto,
  ): Promise<CambioPrecioDto[]> {
    await this.findEntityById(id);
    const skip = paginacion.skip ?? 0;
    const take = paginacion.take ?? 10;
    const cambios = await this.repository.findHistorialPrecios(id, skip, take);
    return cambios.map((cambio) => CambioPrecioMapper.toDto(cambio));
  }

  async remove(id: number, usuarioId: number) {
    const entity = await this.findEntityById(id);

    if (!entity) {
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    }
    

    ensureNotSistemaEntity(entity, 'Producto');

    const usuario = await this.usuarioService.findOne(usuarioId);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado.`);
    }

    await this.repository.remove(entity, usuario);
    return MessageFrontUtils.createSimple(
      `${this.ENTITY_NAME}`,
      entity.denominacion,
      'eliminada',
    );
  }


  async findAllForLineas(denominacion: string) {
    return this.lineaService.findAllFor(denominacion);
  }

  async findAllForMarcas(denominacion: string) {
    return this.marcaService.findAllFor(denominacion);
  }

  async findByDenominacionCodigoProveedorFiltered(
    denominacion: string,
    skip = 0,
    take = 10,
  ): Promise<{ data: GetProductoDto[]; total: number }> {
    this.logger.log(
      `  Buscando en srvice producto o ${denominacion}  skip=${skip}, take=${take}`,
    );
    const result =
      await this.repository.findByDenominacionCodigoProveedorFiltered(
        denominacion,
        skip,
        take,
      );
    this.logger.log(result);
    return {
      data: result.data.map((producto) => {
        return ProductoMapper.toBusquedaDto(producto);
      }),
      total: PaginacionUtils.totalItems(result.total),
    };
  }

  async busquedaPorCoincidenciaParcial(
    denominacion: string,
    skip = 0,
    take = 10,
  ): Promise<{ data: GetProductoDto[]; total: number }> {
    const result = await this.repository.busquedaPorCoincidenciaParcial(
      denominacion,
      skip,
      take,
    );
    return {
      data: result.data.map((producto) => {
        return ProductoMapper.toBusquedaDto(producto);
      }),
      total: PaginacionUtils.totalItems(result.total),
    };
  }

  async findProductosBySuperLinea(
    superLineaId: number,
    skip = 0,
    take = 10,
  ): Promise<{ data: GetProductoDto[]; total: number }> {
    const result = await this.repository.findProductosBySuperLinea(
      superLineaId,
      skip,
      take,
    );
    return {
      data: result.data.map((producto) => {
        return ProductoMapper.toBusquedaDto(producto);
      }),
      total: PaginacionUtils.totalItems(result.total),
    };
  }

  async existsProductosActivosByMarca(marcaId: number): Promise<boolean> {
    return this.repository.existsProductosActivosByMarca(marcaId);
  }
  async existsProductosActivosByLinea(lineaId: number): Promise<boolean> {
    return this.repository.existsProductosActivosByLinea(lineaId);
  }

  async actualizarPrecios(
    dto: ActualizacionPrecioDto,
    usuario?: any,
  ): Promise<{ message: string; productos: Array<{ denominacion: string; costo: number; precio: number }> }> {
    const valor = Number(dto.valor);

    if (!usuario?.id) {
      throw new BadRequestException(
        'No se pudo identificar al usuario autenticado para la actualización.',
      );
    }

    const usuarioAutenticado = await this.usuarioService.findOne(usuario.id);
    if (!usuarioAutenticado) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const resultado = await this.repository.findBy(
      '',
      '',
      false,
      '',
      0,
      dto.lineaId ?? 0,
      0,
      false,
      0,
      10000,
      true,
    );

    const productos = resultado.data;

    if (productos.length === 0) {
      throw new NotFoundException('No se encontraron productos para actualizar.');
    }

    const motivo = dto.lineaId
      ? MotivoCambioPrecio.ActualizacionDePrecioPorLinea
      : MotivoCambioPrecio.ActualizacionDePrecioGlobal;

    for (const producto of productos) {
      const ajuste = valor;

      if (dto.operacion === OperacionAjuste.AUMENTO) {
        if (dto.tipoAjuste === TipoAumento.PORCENTAJE) {
          producto.aumentarPrecioPorPorcentaje(ajuste, motivo);
        } else {
          producto.aumentarPrecioPorMonto(ajuste, motivo);
        }
      } else {
        if (dto.tipoAjuste === TipoAumento.PORCENTAJE) {
          producto.disminuirPrecioPorPorcentaje(ajuste, motivo);
        } else {
          producto.disminuirPrecioPorMonto(ajuste, motivo);
        }
      }
    }

    const productosActualizados = await this.repository.actualizarPrecios(
      productos,
      usuarioAutenticado,
    );

    return {
      message: 'Actualización de precios realizada correctamente.',
      productos: productosActualizados.map((producto) => ({
        denominacion: producto.denominacion,
        costo: Number(producto.costo ?? 0),
        precio: Number(producto.precio ?? 0),
      })),
    };
  }

  async findByIds(ids: number[]): Promise<Producto[]> {
    return this.repository.findByIds(ids);
  }

  async incrementarStock(
    uow: IUnitOfWork,
    productoId: number,
    cantidad: number,
    origen?: string,
  ): Promise<number> {
    return this.ajustarStockInterno(uow, productoId, cantidad, origen);
  }

  async decrementarStock(
    uow: IUnitOfWork,
    productoId: number,
    cantidad: number,
    origen?: string,
  ): Promise<number> {
    return this.ajustarStockInterno(uow, productoId, -cantidad, origen);
  }

  private async ajustarStockInterno(
    uow: IUnitOfWork,
    productoId: number,
    delta: number,
    origen?: string,
  ): Promise<number> {
    const producto = await this.repository.findOne(productoId);
    if (!producto) {
      throw new Error(`Producto con ID ${productoId} no encontrado`);
    }

    const stockActual = producto.stock ?? 0;
    const nuevoStock = stockActual + delta;

    // Política opcional
    // if (nuevoStock < 0) throw ...

    producto.stock = nuevoStock;
    await this.repository.updateEntity(uow, producto);

    this.logger.log(
      `[StockService] ${origen ?? 'Desconocido'} → ${stockActual} → ${nuevoStock}`,
    );

    return nuevoStock;
  }

  /**
   * Orquesta todas las validaciones necesarias para crear un producto
   * @private
   */
  private async validarYPrepararCreacion(dto: CreateProductoDto) {
    // Validar datos  (Domain - sin DB)
    this.intrinsicValidationService.validarDatosBasicos({
      denominacion: dto.denominacion,
      marcaId: dto.marcaId,
      lineaId: dto.lineaId,
      presentacionId: dto.presentacionId,
      alicuotaIva: dto.alicuotaIva,
    });

    // Validar unicidad (Infrastructure - DB)
    await this.uniquenessValidator.validarDenominacionUnica(dto.denominacion);

    if (dto.codigoProveedor) {
      await this.uniquenessValidator.validarCodigoProveedorUnico(
        dto.codigoProveedor,
        0,
      );
    }
    // 3 Validar entidades relacionadas existen (Infrastructure - DB)
    const { marca, linea, } =
      await this.relatedEntitiesValidator.validarYObtenerEntidadesRelacionadas(
        dto.marcaId,
        dto.lineaId,

      );

    //  Validar reglas de negocio sobre entidades (Domain)
    this.validationService.validarEntidadesRelacionadas(
      marca,
      linea,

    );


    //  Validar usuario existe (Infrastructure)
    const usuario = await this.usuarioValidator.validarUsuarioExiste(
      dto.usuarioCreatedId,
    );

    return { marca, linea, usuario };
  }
  /**
   * Orquesta todas las validaciones necesarias para actualizar un producto
   * @private
   */
  private async validarYPrepararActualizacion(
    id: number,
    dto: UpdateProductoDto,
  ) {
    // Obtener producto actual
    const productoActual = await this.repository.findOne(id);
    if (!productoActual)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );

    if (
      productoActual.lineaId == null ||
      productoActual.marcaId == null ||
      productoActual.presentacionId == null
    ) {
      throw new InternalServerErrorException('Producto en estado inválido');
    }

    //  Validar datos intrínsecos
    this.intrinsicValidationService.validarDatosBasicos({
      denominacion: dto.denominacion ?? productoActual.denominacion,
      marcaId: dto.marcaId ?? productoActual.marcaId,
      lineaId: dto.lineaId ?? productoActual.lineaId,
      presentacionId: dto.presentacionId ?? productoActual.presentacionId,
      alicuotaIva: dto.alicuotaIva ?? productoActual.alicuotaIva,
    });

    // Validar unicidad (excluyendo el ID actual)
    if (dto.denominacion) {
      await this.uniquenessValidator.validarDenominacionUnica(
        dto.denominacion,
        id,
      );
    }

    // Validar entidades relacionadas
    const { marca, linea, } =
      await this.relatedEntitiesValidator.validarYObtenerEntidadesRelacionadas(
        dto.marcaId ?? productoActual.marcaId,
        dto.lineaId ?? productoActual.lineaId,

      );

    //  Validar reglas de negocio
    this.validationService.validarEntidadesRelacionadas(
      marca,
      linea,

    );

    // 5 Validar usuario
    const usuario = await this.usuarioValidator.validarUsuarioExiste(
      dto.usuarioUpdatedId,
    );

    return { marca, linea, usuario };
  }

  private async findActivePresentacion(id: number): Promise<Presentacion> {
    const presentacion = await this.presentacionRepository.findOne(id);
    if (!presentacion) {
      throw new NotFoundException(
        `Presentación con ID ${id} no encontrada o eliminada.`,
      );
    }
    return presentacion;
  }


}

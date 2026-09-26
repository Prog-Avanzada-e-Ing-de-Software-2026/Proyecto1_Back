import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Logger,
  ParseIntPipe,
  Put,
  Query,
  UsePipes,
  UseGuards,
} from '@nestjs/common';

import { CreateProductoDto } from '../../dto/create-producto.dto';
import { UpdateProductoDto } from '../../dto/update-producto.dto';
import { NormalizeDenominacionPipe } from 'src/modules/common/pipes/normalize-denominations.pipe';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { Roles } from 'src/modules/gestion-usuario/auth/roles.decorator';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { NormalizeCodigoProveedorPipe } from 'src/modules/common/pipes/normalize-codigo-proveedor.pipe';
import { GetProductoDto } from '../../dto/get-producto.dto';
import { SearchProductoPaginationWithDto } from '../../dto/search-producto-pagination-with.dto';
import { ProductoDto } from '../../dto/producto.dto';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { NormalizeDenominacionSearchPipe } from 'src/modules/common/pipes/normalize-denominations-search.pipe';
import { DenominacionBusquedaDto } from 'src/modules/common/dto/denominacion-busqueda.dto';
import { SearchProductoRapidoDto } from '../../dto/search-producto-rapido.dto';
import { ProductoService } from '../services/producto.service';
import { PaginationWithDenominacionDto } from 'src/modules/common/dto/busquedas/pagination-with-denominacion.dto';
import { SearchProductoSuperlineaDto } from '../../dto/search-producto-superlinea.dto';
import { ActualizacionPrecioDto } from '../../dto/actualizacion-precio.dto';
import { CurrentUser } from 'src/modules/common/decorators/current-user.decorator';
import { PaginationDto } from 'src/modules/common/dto/pagination.dto';
import { CambioPrecioDto } from '../../dto/cambio-precio.dto';
import { MensajeDto } from 'src/modules/common/utils/message/mensajeDto';
import { MarcaDto } from 'src/modules/gestion-productos/marca/dto/marca.dto';
import { LineaDto } from 'src/modules/gestion-productos/linea/dto/linea.dto';
import { ApiListadoConTotal } from 'src/modules/common/interface/listadoConTotalDto';

@ApiTags('Gestion Productos')
@ApiBearerAuth('bearer')
@Controller('producto')
@UseGuards(AuthGuard)
export class ProductoController {
  private readonly logger = new Logger(ProductoController.name);
  constructor(private readonly service: ProductoService) {}

  private readonly ENTITY_NAME = 'Producto';

  @Post()
  @Roles('Root', 'Administrador', 'Empleado', 'Repartidor', 'Repositor')
  @UsePipes(NormalizeDenominacionPipe)
  @UsePipes(NormalizeCodigoProveedorPipe)
  @ApiOperation({
    summary: 'Crear un producto',
    description: 'Registra un nuevo producto en el sistema.',
  })
  @ApiCreatedResponse({
    type: MensajeDto,
    description: 'Producto creado correctamente.',
  })
  create(@Body() createDto: CreateProductoDto) {
    this.logger.log(`Creando un nuevo ${this.ENTITY_NAME}...`);
    return this.service.create(createDto);
  }
  
  @Get('find-all-for-marcas/select')
  @Roles(
    'Root',
    'Administrador',
    'Empleado',
    'Repartidor',
    'Repositor',
    'Vendedor',
  )
  @UsePipes(NormalizeDenominacionSearchPipe)
  @ApiOperation({
    summary: 'Listar marcas para selección',
    description: 'Devuelve las marcas filtradas por denominación.',
  })
  @ApiListadoConTotal(MarcaDto, 'Marcas filtradas por denominación.')
  async findAllMarcasFor(@Query() dto: DenominacionBusquedaDto) {
    const { denominacion = '' } = dto;
    return this.service.findAllForMarcas(denominacion);
  }


  @Get('find-all-for-lineas/select')
  @Roles(
    'Root',
    'Administrador',
    'Empleado',
    'Repartidor',
    'Repositor',
    'Vendedor',
  )
  @UsePipes(NormalizeDenominacionSearchPipe)
  @ApiOperation({
    summary: 'Listar líneas para selección',
    description: 'Devuelve las líneas filtradas por denominación.',
  })
  @ApiListadoConTotal(LineaDto, 'Líneas filtradas por denominación.')
  async findAllLineasFor(@Query() dto: DenominacionBusquedaDto) {
    const { denominacion = '' } = dto;
    return this.service.findAllForLineas(denominacion);
  }

  @Get('search-by-rapido')
  @Roles(
    'Root',
    'Administrador',
    'Empleado',
    'Vendedor',
    'Repartidor',
    'Repositor',
  )
  @UsePipes(NormalizeDenominacionSearchPipe)
  @ApiOperation({
    summary: 'Búsqueda rápida de productos',
    description:
      'Busca productos por código de barras o de proveedor, de forma exacta o parcial.',
  })
  @ApiListadoConTotal(
    GetProductoDto,
    'Productos que coinciden con el código buscado.',
  )
  async searchRapido(@Query() dto: SearchProductoRapidoDto) {
    const { exacto, codigo, skip, take } = dto;
    return this.service.findByRapido(codigo, exacto, skip, take);
  }

  @Get('search-by')
  @Roles(
    'Root',
    'Administrador',
    'Empleado',
    'Vendedor',
    'Repartidor',
    'Repositor',
  )
  @UsePipes(NormalizeDenominacionSearchPipe)
  @ApiOperation({
    summary: 'Búsqueda de productos con filtros',
    description:
      'Busca productos por denominación, código de proveedor, código de referencia, marca, línea, proveedor y stock.',
  })
  @ApiListadoConTotal(
    GetProductoDto,
    'Productos que coinciden con los filtros indicados.',
  )
  async search(@Query() dto: SearchProductoPaginationWithDto) {
    const {
      denominacion = '',
      codProveedorExacto,
      codigoProveedor,
      codigoReferencia,
      marcaId,
      lineaId,
      proveedorId,
      conStock,
      skip,
      take,
    } = dto;
    return this.service.findBy(
      denominacion,
      codigoProveedor,
      codProveedorExacto,
      codigoReferencia,
      marcaId,
      lineaId,
      proveedorId,
      conStock,
      skip,
      take,
    );
  }

  @Get('search-by-denominacion')
  @Roles(
    'Root',
    'Administrador',
    'Empleado',
    'Vendedor',
    'Repartidor',
    'Repositor',
  )
  @ApiOperation({
    summary: 'Buscar productos por denominación',
    description:
      'Devuelve los productos activos que coinciden parcialmente por denominación.',
  })
  @ApiListadoConTotal(
    GetProductoDto,
    'Productos activos que coinciden parcialmente por denominación',
  )
  async searchByPartialDenominacion(@Query() dto: PaginationWithDenominacionDto) {
    const { denominacion = '', skip, take } = dto;
    return this.service.busquedaPorCoincidenciaParcial(
      denominacion,
      skip,
      take,
    );
  }

  @Get('search-by-superlinea')
  @Roles(
    'Root',
    'Administrador',
    'Empleado',
    'Vendedor',
    'Repartidor',
    'Repositor',
  )
  @ApiOperation({
    summary: 'Buscar productos por superlínea',
    description: 'Devuelve los productos activos de una superlínea.',
  })
  @ApiListadoConTotal(GetProductoDto, 'Productos activos de una superlínea')
  async searchBySuperlinea(@Query() dto: SearchProductoSuperlineaDto) {
    const { superLineaId, skip, take } = dto;
    return this.service.findProductosBySuperLinea(superLineaId, skip, take);
  }

  @Get('marca/:id')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Obtener la marca de un producto',
    description: 'Devuelve la marca asociada al producto indicado.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del producto.' })
  @ApiOkResponse({
    type: MarcaDto,
    description: 'Marca asociada al producto.',
  })
  async getMarcaDelProducto(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarMarcaDesdeProducto(id);
  }


  @Get('linea/:id')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Obtener la línea de un producto',
    description: 'Devuelve la línea asociada al producto indicado.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del producto.' })
  @ApiOkResponse({
    type: LineaDto,
    description: 'Línea asociada al producto.',
  })
  async geLineaDelProducto(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarLineaDesdeProducto(id);
  }

  @Get(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Obtener un producto por ID',
    description: 'Devuelve el detalle del producto indicado.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del producto.' })
  @ApiOkResponse({
    type: ProductoDto,
    description: 'Producto encontrado.',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductoDto> {
    this.logger.log(`Buscando  ${this.ENTITY_NAME} con ID: ${id}`);
    return this.service.findDtoById(+id);
  }

  @Put(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionPipe)
  @UsePipes(NormalizeCodigoProveedorPipe)
  @ApiOperation({
    summary: 'Actualizar un producto',
    description: 'Actualiza los datos del producto indicado.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del producto.' })
  @ApiOkResponse({
    type: MensajeDto,
    description: 'Producto actualizado correctamente.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProductoDto,
  ) {
    this.logger.log(`Actualizando  ${this.ENTITY_NAME} con ID: ${id}`);
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Eliminar un producto',
    description: 'Elimina de forma lógica el producto indicado.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del producto.' })
  @ApiQuery({
    name: 'usuarioId',
    type: Number,
    required: true,
    description: 'ID del usuario que realiza la eliminación.',
  })
  @ApiOkResponse({
    type: MensajeDto,
    description: 'Producto eliminado correctamente.',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    this.logger.warn(
      `Eliminando ${this.ENTITY_NAME} con ID: ${id} por usuario: ${usuarioId}`,
    );
    return this.service.remove(id, usuarioId);
  }

  @Post('actualizar-precios')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Actualizar precios de productos',
    description:
      'Aplica un ajuste de precio (porcentaje o monto fijo) a los productos, de forma global o por línea.',
  })
  @ApiCreatedResponse({
    description: 'Precios actualizados correctamente.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Actualización de precios realizada correctamente.',
        },
        productos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              denominacion: {
                type: 'string',
                example: '1158 Caja de tornillos',
              },
              costo: { type: 'number', example: 100.5 },
              precio: { type: 'number', example: 132.5 },
            },
          },
        },
      },
    },
  })
  async actualizarPrecios(
    @Body() dto: ActualizacionPrecioDto,
    @CurrentUser() usuario: any,
  ) {
    this.logger.log('Actualizando precios...');
    return this.service.actualizarPrecios(dto, usuario);
  }

  @Get(':id/audit')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Obtener la auditoría de un producto',
    description: 'Devuelve la información de auditoría del producto indicado.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del producto.' })
  @ApiOkResponse({
    description: 'Informacion de auditoria',
    type: AuditoriaDto,
  })
  async findByIdConAuditoria(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AuditoriaDto> {
    const data = await this.service.findByIdConAuditoria(id);
    return data;
  }

  @Get(':id/historial-precios')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Obtener el historial de precios de un producto',
    description: 'Devuelve el historial de cambios de precio del producto indicado.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID del producto.' })
  @ApiOkResponse({
    description: 'Historial de cambios de precio del producto',
    type: CambioPrecioDto,
    isArray: true,
  })
  async historialPrecios(
    @Param('id', ParseIntPipe) id: number,
    @Query() paginacion: PaginationDto,
  ): Promise<CambioPrecioDto[]> {
    return this.service.getHistorialPrecios(id, paginacion);
  }
}

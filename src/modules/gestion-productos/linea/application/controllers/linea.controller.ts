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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaginationWithDenominacionDto } from 'src/modules/common/dto/busquedas/pagination-with-denominacion.dto';
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
import { NormalizeDenominacionSearchPipe } from 'src/modules/common/pipes/normalize-denominations-search.pipe';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { LineaService } from '../services/linea.service';
import { CreateLineaDto } from '../../dto/create-linea.dto';
import { LineaDto } from '../../dto/linea.dto';
import { UpdateLineaDto } from '../../dto/update-linea.dto';
import { SelectLineaDto } from '../../dto/select-linea.dto';
import { MensajeDto } from 'src/modules/common/utils/message/mensajeDto';
import { SelectOption } from 'src/modules/common/interface/select-option';
import { SuperLineaDto } from 'src/modules/gestion-productos/superlinea/dto/superlinea.dto';
import { ApiListadoConTotal } from 'src/modules/common/interface/listadoConTotalDto';

@ApiTags('Gestion Productos')
@ApiBearerAuth('bearer')
@Controller('linea')
@UseGuards(AuthGuard)
export class LineaController {
  private readonly logger = new Logger(LineaController.name);
  constructor(private readonly service: LineaService) {}

  private readonly ENTITY_NAME = 'Linea';

  @Post()
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionPipe)
  @ApiOperation({
    summary: 'Crear una línea',
    description: 'Registra una nueva línea en el sistema.',
  })
  @ApiCreatedResponse({
    type: LineaDto,
    description: 'Línea creada correctamente.',
  })
  create(@Body() createDto: CreateLineaDto) {
    this.logger.log(`Creando un nuevo ${this.ENTITY_NAME}...`);
    return this.service.create(createDto);
  }

  @Get('search-by')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionSearchPipe)
  @ApiOperation({
    summary: 'Buscar líneas con filtros',
    description:
      'Devuelve las líneas filtradas por denominación, con paginación.',
  })
  @ApiListadoConTotal(LineaDto, 'Líneas que coinciden con los filtros indicados.')
  findByDenominacionFiltered(
    @Query() paginationDto: PaginationWithDenominacionDto,
  ) {
    const { denominacion = '', skip, take, incluirEliminados } = paginationDto;
    this.logger.log(`Buscando usuarios con denominación: ${denominacion}`);
    return this.service.findByDenominacionFiltered(
      denominacion,
      skip,
      take,
      incluirEliminados,
    );
  }

  @Get('select')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Listar líneas para selección',
    description:
      'Devuelve las líneas activas que coinciden parcialmente por denominación.',
  })
  @ApiOkResponse({
    type: SelectOption,
    isArray: true,
    description: 'Líneas activas que coinciden parcialmente por denominación.',
  })
  searchForSelection(@Query() dto: SelectLineaDto) {
    const { denominacion = '' } = dto;
    return this.service.busquedaPorCoincidenciaParcial(denominacion);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una línea por ID',
    description: 'Devuelve el detalle de la línea indicada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la línea.' })
  @ApiOkResponse({ type: LineaDto, description: 'Línea encontrada.' })
  @Roles('Root', 'Administrador', 'Empleado')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<LineaDto> {
    this.logger.log(`Buscando  ${this.ENTITY_NAME} con ID: ${id}`);
    return this.service.findDtoById(+id);
  }

  @Get('find-all-for-superlinea/select')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionSearchPipe)
  @ApiOperation({
    summary: 'Listar superlíneas para selección',
    description:
      'Devuelve las superlíneas filtradas por denominación para asociarlas a una línea.',
  })
  @ApiOkResponse({
    type: SuperLineaDto,
    isArray: true,
    description: 'Superlíneas filtradas por denominación.',
  })
  findAllForSuperLineas(@Query() dto: SelectLineaDto) {
    const { denominacion = '' } = dto;
    return this.service.findAllForSuperLineas(denominacion);
  }

  @Put(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionPipe)
  @ApiOperation({
    summary: 'Actualizar una línea',
    description: 'Actualiza los datos de la línea indicada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la línea.' })
  @ApiOkResponse({
    type: MensajeDto,
    description: 'Línea actualizada correctamente.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateLineaDto,
  ) {
    this.logger.log(`Actualizando  ${this.ENTITY_NAME} con ID: ${id}`);
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Eliminar una línea',
    description: 'Elimina de forma lógica la línea indicada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la línea.' })
  @ApiQuery({
    name: 'usuarioId',
    type: Number,
    required: true,
    description: 'ID del usuario que realiza la eliminación.',
  })
  @ApiOkResponse({
    type: MensajeDto,
    description: 'Línea eliminada correctamente.',
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

  @Get(':id/audit')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Obtener la auditoría de una línea',
    description: 'Devuelve la información de auditoría de la línea indicada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la línea.' })
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

}

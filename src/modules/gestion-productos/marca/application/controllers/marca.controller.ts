import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UsePipes,
  Logger,
  Query,
  Put,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CreateMarcaDto } from '../../dto/create-marca.dto';
import { UpdateMarcaDto } from '../../dto/update-marca.dto';
import { NormalizeDenominacionPipe } from 'src/modules/common/pipes/normalize-denominations.pipe';
import { PaginationWithDenominacionDto } from 'src/modules/common/dto/busquedas/pagination-with-denominacion.dto';
import { Roles } from 'src/modules/gestion-usuario/auth/roles.decorator';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { MarcaDto } from '../../dto/marca.dto';
import { NormalizeDenominacionSearchPipe } from 'src/modules/common/pipes/normalize-denominations-search.pipe';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { MarcaService } from '../services/marca.service';
import { MensajeDto } from 'src/modules/common/utils/message/mensajeDto';
import { ApiListadoConTotal } from 'src/modules/common/interface/listadoConTotalDto';

@ApiTags('Gestion Productos')
@ApiBearerAuth('bearer')
@Controller('marca')
@UseGuards(AuthGuard)
export class MarcaController {
  private readonly logger = new Logger(MarcaController.name);
  constructor(private readonly service: MarcaService) {}

  private readonly ENTITY_NAME = 'Marca';

  @Post()
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionPipe)
  @ApiOperation({
    summary: 'Crear una marca',
    description: 'Registra una nueva marca en el sistema.',
  })
  @ApiCreatedResponse({
    type: MensajeDto,
    description: 'Marca creada correctamente.',
  })
  create(@Body() createDto: CreateMarcaDto) {
    this.logger.log(`Creando un nuevo ${this.ENTITY_NAME}...`);
    return this.service.create(createDto);
  }

  @Get('search-by')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionSearchPipe)
  @ApiOperation({
    summary: 'Buscar marcas con filtros',
    description:
      'Devuelve las marcas filtradas por denominación, con paginación.',
  })
  @ApiListadoConTotal(MarcaDto, 'Marcas que coinciden con los filtros indicados.')
  findByDenominacionFiltered(
    @Query() paginationDto: PaginationWithDenominacionDto,
  ) {
    const { denominacion = '', skip, take, incluirEliminados } = paginationDto;
    this.logger.log(
      `Buscando ${this.ENTITY_NAME} con denominación: ${denominacion}`,
    );
    return this.service.findBy(denominacion, skip, take, incluirEliminados);
  }

  @Get(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Obtener una marca por ID',
    description: 'Devuelve el detalle de la marca indicada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la marca.' })
  @ApiOkResponse({ type: MarcaDto, description: 'Marca encontrada.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<MarcaDto> {
    this.logger.log(`Buscando ${this.ENTITY_NAME} con ID: ${id}`);
    return this.service.findDtoById(id);
  }

  @Put(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionPipe)
  @ApiOperation({
    summary: 'Actualizar una marca',
    description: 'Actualiza los datos de la marca indicada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la marca.' })
  @ApiOkResponse({
    type: MensajeDto,
    description: 'Marca actualizada correctamente.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMarcaDto,
  ) {
    this.logger.log(`Actualizando  ${this.ENTITY_NAME} con ID: ${id}`);
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Eliminar una marca',
    description: 'Elimina de forma lógica la marca indicada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la marca.' })
  @ApiQuery({
    name: 'usuarioId',
    type: Number,
    required: true,
    description: 'ID del usuario que realiza la eliminación.',
  })
  @ApiOkResponse({
    type: MensajeDto,
    description: 'Marca eliminada correctamente.',
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
    summary: 'Obtener la auditoría de una marca',
    description: 'Devuelve la información de auditoría de la marca indicada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la marca.' })
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

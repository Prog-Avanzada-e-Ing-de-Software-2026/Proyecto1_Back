import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { MensajeDto } from 'src/modules/common/utils/message/mensajeDto';
import { PaginationWithDenominacionDto } from 'src/modules/common/dto/busquedas/pagination-with-denominacion.dto';
import { NormalizeDenominacionPipe } from 'src/modules/common/pipes/normalize-denominations.pipe';
import { NormalizeDenominacionSearchPipe } from 'src/modules/common/pipes/normalize-denominations-search.pipe';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { Roles } from 'src/modules/gestion-usuario/auth/roles.decorator';
import { CreatePresentacionDto } from '../../dto/create-presentacion.dto';
import { SelectPresentacionDto } from '../../dto/select-presentacion.dto';
import { PresentacionDto } from '../../dto/presentacion.dto';
import { UpdatePresentacionDto } from '../../dto/update-presentacion.dto';
import { PresentacionService } from '../services/presentacion.service';
import { ApiListadoConTotal } from 'src/modules/common/interface/listadoConTotalDto';

@ApiTags('Gestion Productos')
@ApiBearerAuth('bearer')
@Controller('presentacion')
@UseGuards(AuthGuard)
export class PresentacionController {
  private readonly logger = new Logger(PresentacionController.name);

  constructor(private readonly service: PresentacionService) {}

  @Post()
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionPipe)
  @ApiOperation({
    summary: 'Crear una presentación',
    description: 'Registra una nueva presentación en el sistema.',
  })
  @ApiCreatedResponse({
    type: MensajeDto,
    description: 'Presentación creada correctamente.',
  })
  create(@Body() dto: CreatePresentacionDto) {
    this.logger.log(`Creando una nueva Presentación: ${dto.denominacion}`);
    return this.service.create(dto);
  }

  @Get('search-by')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionSearchPipe)
  @ApiOperation({
    summary: 'Buscar presentaciones con filtros',
    description:
      'Devuelve las presentaciones filtradas por denominación, con paginación.',
  })
  @ApiListadoConTotal(
    PresentacionDto,
    'Presentaciones que coinciden con los filtros indicados.',
  )
  search(@Query() dto: PaginationWithDenominacionDto) {
    return this.service.findBy(dto);
  }

  @Get('select')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionSearchPipe)
  @ApiOperation({
    summary: 'Listar presentaciones para selección',
    description:
      'Devuelve las presentaciones activas que coinciden parcialmente por denominación.',
  })
  @ApiListadoConTotal(
    PresentacionDto,
    'Presentaciones activas que coinciden por denominación.',
  )
  select(@Query() dto: SelectPresentacionDto) {
    return this.service.findAllFor(dto.denominacion ?? '');
  }

  @Get(':id/audit')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Obtener la auditoría de una presentación',
    description:
      'Devuelve la información de auditoría de la presentación indicada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la presentación.' })
  @ApiOkResponse({ type: AuditoriaDto, description: 'Informacion de auditoria' })
  findByIdConAuditoria(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByIdConAuditoria(id);
  }

  @Get(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Obtener una presentación por ID',
    description: 'Devuelve el detalle de la presentación indicada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la presentación.' })
  @ApiOkResponse({
    type: PresentacionDto,
    description: 'Presentación encontrada.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findDtoById(id);
  }

  @Put(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionPipe)
  @ApiOperation({
    summary: 'Actualizar una presentación',
    description: 'Actualiza los datos de la presentación indicada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la presentación.' })
  @ApiOkResponse({
    type: MensajeDto,
    description: 'Presentación actualizada correctamente.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePresentacionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Eliminar una presentación',
    description: 'Elimina de forma lógica la presentación indicada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la presentación.' })
  @ApiQuery({
    name: 'usuarioId',
    type: Number,
    required: true,
    description: 'ID del usuario que realiza la eliminación.',
  })
  @ApiOkResponse({
    type: MensajeDto,
    description: 'Presentación eliminada correctamente.',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    return this.service.remove(id, usuarioId);
  }
}

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
import { SelectOption } from 'src/modules/common/interface/select-option';
import { PaginationWithDenominacionDto } from 'src/modules/common/dto/busquedas/pagination-with-denominacion.dto';
import { NormalizeDenominacionPipe } from 'src/modules/common/pipes/normalize-denominations.pipe';
import { NormalizeDenominacionSearchPipe } from 'src/modules/common/pipes/normalize-denominations-search.pipe';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { Roles } from 'src/modules/gestion-usuario/auth/roles.decorator';
import { CreateSuperLineaDto } from '../../dto/create-superlinea.dto';
import { SelectSuperLineaDto } from '../../dto/select-superlinea.dto';
import { SuperLineaDto } from '../../dto/superlinea.dto';
import { UpdateSuperLineaDto } from '../../dto/update-superlinea.dto';
import { SuperLineaService } from '../services/superlinea.service';
import { ApiListadoConTotal } from 'src/modules/common/interface/listadoConTotalDto';

@ApiTags('Gestion Productos')
@ApiBearerAuth('bearer')
@Controller('superlinea')
@UseGuards(AuthGuard)
export class SuperLineaController {
  private readonly logger = new Logger(SuperLineaController.name);

  constructor(private readonly service: SuperLineaService) {}

  @Post()
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionPipe)
  @ApiOperation({
    summary: 'Crear una superlínea',
    description: 'Registra una nueva superlínea en el sistema.',
  })
  @ApiCreatedResponse({
    type: MensajeDto,
    description: 'Superlínea creada correctamente.',
  })
  create(@Body() dto: CreateSuperLineaDto) {
    this.logger.log(`Creando una nueva SuperLínea: ${dto.denominacion}`);
    return this.service.create(dto);
  }

  @Get('search-by')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionSearchPipe)
  @ApiOperation({
    summary: 'Buscar superlíneas con filtros',
    description:
      'Devuelve las superlíneas filtradas por denominación, con paginación.',
  })
  @ApiListadoConTotal(
    SuperLineaDto,
    'Superlíneas que coinciden con los filtros indicados.',
  )
  search(@Query() dto: PaginationWithDenominacionDto) {
    return this.service.findBy(dto);
  }

  @Get('select')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Listar superlíneas para selección',
    description:
      'Devuelve las superlíneas activas que coinciden parcialmente por denominación.',
  })
  @ApiOkResponse({
    type: SelectOption,
    isArray: true,
    description: 'SuperLíneas activas que coinciden parcialmente por denominación.',
  })
  searchForSelection(@Query() dto: SelectSuperLineaDto) {
    const { denominacion = '' } = dto;
    return this.service.busquedaPorCoincidenciaParcial(denominacion);
  }

  @Get(':id/audit')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Obtener la auditoría de una superlínea',
    description:
      'Devuelve la información de auditoría de la superlínea indicada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la superlínea.' })
  @ApiOkResponse({ type: AuditoriaDto, description: 'Informacion de auditoria' })
  findByIdConAuditoria(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByIdConAuditoria(id);
  }

  @Get(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Obtener una superlínea por ID',
    description: 'Devuelve el detalle de la superlínea indicada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la superlínea.' })
  @ApiOkResponse({
    type: SuperLineaDto,
    description: 'SuperLínea encontrada.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findDtoById(id);
  }

  @Put(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionPipe)
  @ApiOperation({
    summary: 'Actualizar una superlínea',
    description: 'Actualiza los datos de la superlínea indicada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la superlínea.' })
  @ApiOkResponse({
    type: MensajeDto,
    description: 'Superlínea actualizada correctamente.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSuperLineaDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOperation({
    summary: 'Eliminar una superlínea',
    description: 'Elimina de forma lógica la superlínea indicada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la superlínea.' })
  @ApiQuery({
    name: 'usuarioId',
    type: Number,
    required: true,
    description: 'ID del usuario que realiza la eliminación.',
  })
  @ApiOkResponse({
    type: MensajeDto,
    description: 'Superlínea eliminada correctamente.',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    return this.service.remove(id, usuarioId);
  }
}

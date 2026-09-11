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
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
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

@ApiTags('Gestion Productos')
@Controller('superlinea')
@UseGuards(AuthGuard)
export class SuperLineaController {
  private readonly logger = new Logger(SuperLineaController.name);

  constructor(private readonly service: SuperLineaService) {}

  @Post()
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionPipe)
  create(@Body() dto: CreateSuperLineaDto) {
    this.logger.log(`Creando una nueva SuperLínea: ${dto.denominacion}`);
    return this.service.create(dto);
  }

  @Get('search-by')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionSearchPipe)
  search(@Query() dto: PaginationWithDenominacionDto) {
    const { denominacion = '', skip, take, incluirEliminados } = dto;
    return this.service.findBy(
      denominacion,
      skip,
      take,
      incluirEliminados,
    );
  }

  @Get('select')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionSearchPipe)
  select(@Query() dto: SelectSuperLineaDto) {
    return this.service.findAllFor(dto.denominacion ?? '');
  }

  @Get(':id/audit')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOkResponse({ type: AuditoriaDto })
  findByIdConAuditoria(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByIdConAuditoria(id);
  }

  @Get(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOkResponse({ type: SuperLineaDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findDtoById(id);
  }

  @Put(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionPipe)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSuperLineaDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    return this.service.remove(id, usuarioId);
  }
}

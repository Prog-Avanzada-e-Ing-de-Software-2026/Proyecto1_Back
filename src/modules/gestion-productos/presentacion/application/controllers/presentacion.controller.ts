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
import { CreatePresentacionDto } from '../../dto/create-presentacion.dto';
import { SelectPresentacionDto } from '../../dto/select-presentacion.dto';
import { PresentacionDto } from '../../dto/presentacion.dto';
import { UpdatePresentacionDto } from '../../dto/update-presentacion.dto';
import { PresentacionService } from '../services/presentacion.service';

@ApiTags('Gestion Productos')
@Controller('presentacion')
@UseGuards(AuthGuard)
export class PresentacionController {
  private readonly logger = new Logger(PresentacionController.name);

  constructor(private readonly service: PresentacionService) {}

  @Post()
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionPipe)
  create(@Body() dto: CreatePresentacionDto) {
    this.logger.log(`Creando una nueva Presentación: ${dto.denominacion}`);
    return this.service.create(dto);
  }

  @Get('search-by')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionSearchPipe)
  search(@Query() dto: PaginationWithDenominacionDto) {
    return this.service.findBy(dto);
  }

  @Get('select')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionSearchPipe)
  select(@Query() dto: SelectPresentacionDto) {
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
  @ApiOkResponse({ type: PresentacionDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findDtoById(id);
  }

  @Put(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionPipe)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePresentacionDto,
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

import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ProductoOperacionService } from './producto-operacion.service';
import { CreateProductoOperacionDto } from './dto/create-producto-operacion.dto';
import { UpdateProductoOperacionDto } from './dto/update-producto-operacion.dto';

@ApiTags('Gestion Productos')
@Controller('producto-operacion')
export class ProductoOperacionController {
  constructor(private readonly productoOperacionService: ProductoOperacionService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una operación de producto',
    description:
      'Endpoint provisional. Devuelve un mensaje de texto mientras la operación no está implementada.',
  })
  @ApiCreatedResponse({
    type: String,
    description: 'Mensaje de confirmación de creación.',
  })
  create(@Body() createProductoOperacionDto: CreateProductoOperacionDto) {
    return this.productoOperacionService.create(createProductoOperacionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar operaciones de producto',
    description:
      'Endpoint provisional. Devuelve un mensaje de texto mientras la operación no está implementada.',
  })
  @ApiOkResponse({
    type: String,
    description: 'Mensaje con el listado de operaciones de producto.',
  })
  findAll() {
    return this.productoOperacionService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una operación de producto por ID',
    description:
      'Endpoint provisional. Devuelve un mensaje de texto mientras la operación no está implementada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la operación de producto.' })
  @ApiOkResponse({
    type: String,
    description: 'Mensaje con la operación de producto encontrada.',
  })
  findOne(@Param('id') id: string) {
    return this.productoOperacionService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar una operación de producto',
    description:
      'Endpoint provisional. Devuelve un mensaje de texto mientras la operación no está implementada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la operación de producto.' })
  @ApiOkResponse({
    type: String,
    description: 'Mensaje de confirmación de actualización.',
  })
  update(@Param('id') id: string, @Body() updateProductoOperacionDto: UpdateProductoOperacionDto) {
    return this.productoOperacionService.update(+id, updateProductoOperacionDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar una operación de producto',
    description:
      'Endpoint provisional. Devuelve un mensaje de texto mientras la operación no está implementada.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la operación de producto.' })
  @ApiOkResponse({
    type: String,
    description: 'Mensaje de confirmación de eliminación.',
  })
  remove(@Param('id') id: string) {
    return this.productoOperacionService.remove(+id);
  }
}

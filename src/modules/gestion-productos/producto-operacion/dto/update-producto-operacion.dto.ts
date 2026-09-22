import { PartialType } from '@nestjs/mapped-types';
import { CreateProductoOperacionDto } from './create-producto-operacion.dto';
import { IsOptionalWhenUndefined } from '../../common/validation/request-validation.helpers';

class UpdateProductoOperacionDtoBase extends PartialType(
  CreateProductoOperacionDto,
) {}

export class UpdateProductoOperacionDto extends UpdateProductoOperacionDtoBase {
  @IsOptionalWhenUndefined()
  productoId?: number;

  @IsOptionalWhenUndefined()
  operacionId?: number;

  @IsOptionalWhenUndefined()
  tipoOperacion?: string;
}

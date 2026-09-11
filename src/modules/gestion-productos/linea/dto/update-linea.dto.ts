import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateLineaDto } from './create-linea.dto';
import { IsNotEmpty, IsInt, ValidateIf } from 'class-validator';

export class UpdateLineaDto extends PartialType(
  OmitType(CreateLineaDto, ['superLineaId', 'usuarioCreatedId'] as const),
) {
  @ValidateIf((_, value) => value !== undefined)
  @IsNotEmpty({ message: 'El superLineaId no puede ser nulo.' })
  @IsInt({ message: 'El superLineaId debe ser un número entero.' })
  superLineaId?: number;

  @IsNotEmpty({ message: 'El usuarioUpdatedId es obligatorio.' })
  @IsInt({ message: 'El usuarioUpdatedId debe ser un número entero.' })
  usuarioUpdatedId: number;
}

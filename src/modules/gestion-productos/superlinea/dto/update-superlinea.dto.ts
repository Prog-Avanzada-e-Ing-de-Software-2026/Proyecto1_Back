import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty } from 'class-validator';
import { CreateSuperLineaDto } from './create-superlinea.dto';

export class UpdateSuperLineaDto extends PartialType(
  OmitType(CreateSuperLineaDto, ['usuarioCreatedId'] as const),
) {
  @IsNotEmpty({ message: 'El usuarioUpdatedId es obligatorio.' })
  @IsInt({ message: 'El usuarioUpdatedId debe ser un número entero.' })
  usuarioUpdatedId: number;
}

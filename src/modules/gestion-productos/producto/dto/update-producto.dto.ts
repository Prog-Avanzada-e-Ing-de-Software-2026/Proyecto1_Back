import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateProductoDto } from './create-producto.dto';
import {
  IsNotEmpty,
  IsInt,
  IsString,
  IsNumber,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProductoDto extends PartialType(
  OmitType(CreateProductoDto, [
    'denominacion',
    'costo',
    'porcentaje',
    'stock',
    'stockMinimo',
    'marcaId',
    'lineaId',
    'presentacionId',
    'usuarioCreatedId',
  ] as const),
) {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: 'La denominación debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La denominación no puede estar vacía.' })
  @MaxLength(255, { message: 'La denominación no puede estar vacía.' })
  @Matches(/^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ.\-/]+$/, {
    message:
      'La denominación solo puede contener letras, números, espacios, puntos, guiones y barras.',
  })
  denominacion: string;

  @IsNotEmpty()
  @IsNumber()
  costo: number;

  @IsNotEmpty()
  @IsNumber()
  porcentaje: number;

  @IsNotEmpty()
  @IsInt()
  stock: number;

  @IsNotEmpty()
  @IsInt()
  stockMinimo: number;

  @IsNotEmpty({ message: 'La marca es obligatoria.' })
  @IsInt({ message: 'La marca  debe ser un número entero.' })
  marcaId: number;

  @IsNotEmpty({ message: 'La linea es obligatoria.' })
  @IsInt({ message: 'La linea  debe ser un número entero.' })
  lineaId: number;

  @IsNotEmpty({ message: 'La presentación es obligatoria.' })
  @IsInt({ message: 'La presentación debe ser un número entero.' })
  presentacionId: number;

  @IsNotEmpty({ message: 'El usuarioUpdatedId es obligatorio.' })
  @IsInt({ message: 'El usuarioUpdatedId debe ser un número entero.' })
  usuarioUpdatedId: number;

  updatedAt: Date;
}

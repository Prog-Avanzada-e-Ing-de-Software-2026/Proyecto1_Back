import { ApiProperty } from '@nestjs/swagger';

export class SelectOption {
  @ApiProperty({
    description: 'Código identificador de la opción.',
    example: 1,
  })
  codigo: number;

  @ApiProperty({
    description: 'Nombre de la opción.',
    example: 'tornillos',
  })
  nombre: string;

  @ApiProperty({
    description: 'Descripción de la opción.',
    example: '',
  })
  descripcion: string;
}

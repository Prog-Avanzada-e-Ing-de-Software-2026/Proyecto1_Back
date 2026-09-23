import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PresentacionDto {
  @ApiProperty({ type: Number, example: 1, description: 'ID de la presentación.' })
  id: number;

  @ApiProperty({
    type: String,
    example: '1L',
    description: 'Denominación o nombre de la presentación.',
  })
  denominacion: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Botella de un litro',
    description: 'Observaciones varias sobre la presentación.',
  })
  observacion: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: null,
    description: 'Fecha de eliminación (null si está activa).',
  })
  deletedAt: string | null;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SuperLineaDto {
  @ApiProperty({ type: Number, example: 1, description: 'ID de la superlínea.' })
  id: number;

  @ApiProperty({
    type: String,
    example: 'Herramientas',
    description: 'Denominación o nombre de la superlínea.',
  })
  denominacion: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Uso industrial',
    description: 'Observaciones varias sobre la superlínea.',
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

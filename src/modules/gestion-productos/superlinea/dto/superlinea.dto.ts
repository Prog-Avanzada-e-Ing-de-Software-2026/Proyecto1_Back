import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SuperLineaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Herramientas' })
  denominacion: string;

  @ApiPropertyOptional({ example: 'Uso industrial' })
  observacion: string;

  @ApiProperty({ nullable: true, example: null })
  deletedAt: string | null;
}

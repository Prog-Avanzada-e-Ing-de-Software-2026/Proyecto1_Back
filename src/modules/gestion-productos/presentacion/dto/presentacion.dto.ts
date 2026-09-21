import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PresentacionDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '1L' })
  denominacion: string;

  @ApiPropertyOptional({ example: 'Botella de un litro' })
  observacion: string;

  @ApiProperty({ nullable: true, example: null })
  deletedAt: string | null;
}

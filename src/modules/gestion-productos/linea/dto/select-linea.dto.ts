import { IsOptional, IsString } from 'class-validator';

export class SelectLineaDto {
  @IsOptional()
  @IsString()
  denominacion?: string;
}

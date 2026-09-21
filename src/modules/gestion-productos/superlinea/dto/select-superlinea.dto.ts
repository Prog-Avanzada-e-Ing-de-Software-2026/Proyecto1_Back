import { IsOptional, IsString } from 'class-validator';

export class SelectSuperLineaDto {
  @IsOptional()
  @IsString()
  denominacion?: string;
}

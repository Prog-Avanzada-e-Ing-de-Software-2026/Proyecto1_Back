import { IsOptional, IsString } from 'class-validator';

export class SelectPresentacionDto {
  @IsOptional()
  @IsString()
  denominacion?: string;
}

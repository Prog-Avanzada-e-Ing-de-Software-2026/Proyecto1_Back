import { IsBoolean, IsInt, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  toQueryNumber,
  toStrictBoolean,
} from '../../common/validation/request-validation.helpers';

export class SearchProductoRapidoDto {
  @IsString()
  codigo: string;

  @Transform(({ value }) => toStrictBoolean(value))
  @IsBoolean({ message: 'exacto debe ser un valor booleano.' })
  exacto: boolean = false;

  @IsInt({ message: 'skip debe ser un número entero.' })
  @Min(0, { message: 'skip debe ser un número entero positivo o 0' })
  @Transform(({ value }) => toQueryNumber(value))
  skip: number = 0;

  @IsInt({ message: 'take debe ser un número entero.' })
  @Min(1, { message: 'take debe ser un número entero mayor que 0' })
  @Transform(({ value }) => toQueryNumber(value))
  take: number = 10;
}

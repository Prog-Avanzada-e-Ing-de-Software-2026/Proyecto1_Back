import { CambioPrecio } from '../domain/entities/cambio-precio.entity';
import { CambioPrecioDto } from '../dto/cambio-precio.dto';

export class CambioPrecioMapper {
  static toDto(cambio: CambioPrecio): CambioPrecioDto {
    const dto = new CambioPrecioDto();
    dto.fecha = cambio.fecha;
    dto.precioAnterior = Number(cambio.precioAnterior);
    dto.precioNuevo = Number(cambio.precioNuevo);
    dto.motivo = cambio.motivo;
    return dto;
  }
}
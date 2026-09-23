import { BadRequestException, Injectable } from '@nestjs/common';
import {
  fitsQuantityRange,
  isFiniteNumber,
  isPositiveInteger,
} from '../../../common/validation/numeric-rules';

interface LineaIntrinsicState {
  denominacion?: unknown;
  superLineaId?: unknown;
  stockMinimo?: unknown;
  utilizaStockMinimo?: unknown;
  observacion?: unknown;
  usuarioCreatedId?: unknown;
  usuarioUpdatedId?: unknown;
}

@Injectable()
export class LineaIntrinsicValidationService {
  validarDatosBasicos(
    datos: LineaIntrinsicState,
    opciones: { requerirEstadoCompleto?: boolean } = {},
  ): void {
    const { requerirEstadoCompleto = false } = opciones;

    this.validarDenominacion(datos.denominacion, requerirEstadoCompleto);
    this.validarSuperLineaId(datos.superLineaId, requerirEstadoCompleto);
    this.validarStockMinimo(datos.stockMinimo);
    this.validarIdPositivo(
      datos.usuarioCreatedId,
      'usuarioCreatedId',
      requerirEstadoCompleto,
    );
    this.validarIdPositivo(datos.usuarioUpdatedId, 'usuarioUpdatedId', false);

    if (datos.utilizaStockMinimo !== undefined) {
      this.validarBooleano(datos.utilizaStockMinimo, 'utilizaStockMinimo');
    }
  }

  private validarDenominacion(value: unknown, requerido: boolean): void {
    if (value === undefined || value === null) {
      if (requerido) {
        throw new BadRequestException('La denominación es obligatoria');
      }
      return;
    }

    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(
        'La denominación debe ser una cadena no vacía',
      );
    }

    if (value.length > 255) {
      throw new BadRequestException(
        'La denominación no puede superar 255 caracteres',
      );
    }
  }

  private validarSuperLineaId(value: unknown, requerido: boolean): void {
    if (value === undefined || value === null) {
      if (requerido) {
        throw new BadRequestException('La SuperLínea es requerida');
      }
      return;
    }

    if (!isPositiveInteger(value)) {
      throw new BadRequestException(
        'El superLineaId debe ser un número entero positivo',
      );
    }
  }

  private validarStockMinimo(value: unknown): void {
    if (value === undefined || value === null) {
      return;
    }

    if (!isFiniteNumber(value)) {
      throw new BadRequestException('El stock mínimo debe ser un número finito');
    }

    if (value < 0) {
      throw new BadRequestException(
        'El stock mínimo debe ser mayor o igual a 0',
      );
    }

    if (!fitsQuantityRange(value)) {
      throw new BadRequestException(
        'El stock mínimo debe estar dentro del rango de cantidad permitido',
      );
    }
  }

  private validarIdPositivo(
    value: unknown,
    campo: string,
    requerido: boolean,
  ): void {
    if (value === undefined || value === null) {
      if (requerido) {
        throw new BadRequestException(`El ${campo} es requerido`);
      }
      return;
    }

    if (!isPositiveInteger(value)) {
      throw new BadRequestException(
        `El ${campo} debe ser un número entero positivo`,
      );
    }
  }

  private validarBooleano(value: unknown, campo: string): void {
    if (typeof value !== 'boolean') {
      throw new BadRequestException(`${campo} debe ser un valor booleano`);
    }
  }
}

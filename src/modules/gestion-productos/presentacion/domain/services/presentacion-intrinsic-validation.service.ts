import { BadRequestException, Injectable } from '@nestjs/common';
import { isPositiveInteger } from '../../../common/validation/request-validation.helpers';

interface PresentacionIntrinsicState {
  denominacion?: unknown;
  observacion?: unknown;
  usuarioCreatedId?: unknown;
  usuarioUpdatedId?: unknown;
}

@Injectable()
export class PresentacionIntrinsicValidationService {
  validarDatosBasicos(
    datos: PresentacionIntrinsicState,
    opciones: { requerirEstadoCompleto?: boolean } = {},
  ): void {
    const { requerirEstadoCompleto = false } = opciones;

    this.validarDenominacion(datos.denominacion, requerirEstadoCompleto);
    this.validarIdPositivo(
      datos.usuarioCreatedId,
      'usuarioCreatedId',
      requerirEstadoCompleto,
    );
    this.validarIdPositivo(datos.usuarioUpdatedId, 'usuarioUpdatedId', false);
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
}

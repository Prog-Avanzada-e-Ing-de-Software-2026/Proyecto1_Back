import { BadRequestException } from '@nestjs/common';
import { ProductoIntrinsicValidationService } from './producto-intrinsic-validation.service.ts';

describe('ProductoIntrinsicValidationService', () => {
  const service = new ProductoIntrinsicValidationService();

  const datosValidos = {
    denominacion: 'Coca-Cola',
    marcaId: 1,
    lineaId: 2,
    presentacionId: 3,
  };

  it('acepta datos básicos con presentacionId válido', () => {
    expect(() => service.validarDatosBasicos(datosValidos)).not.toThrow();
  });

  it.each([undefined, null, 0, -1])(
    'rechaza presentacionId inválido (%s)',
    (presentacionId) => {
      expect(() =>
        service.validarDatosBasicos({
          ...datosValidos,
          presentacionId: presentacionId as number,
        }),
      ).toThrow(BadRequestException);
    },
  );
});

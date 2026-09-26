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

  it.each([
    [200, false],
    [201, true],
  ] as const)(
    'CP - Validar el límite de 200 caracteres de la denominación (%s caracteres)',
    (longitud, debeRechazar) => {
      const datos = { ...datosValidos, denominacion: 'A'.repeat(longitud) };

      if (debeRechazar) {
        expect(() => service.validarDatosBasicos(datos)).toThrow(
          BadRequestException,
        );
      } else {
        expect(() => service.validarDatosBasicos(datos)).not.toThrow();
      }
    },
  );
});

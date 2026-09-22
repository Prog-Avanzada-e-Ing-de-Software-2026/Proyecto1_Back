import { validate } from 'class-validator';
import { ActualizacionPrecioDto } from './actualizacion-precio.dto';
import { TipoAumento } from 'src/modules/common/enums/tipo-aumento.emun';
import { OperacionAjuste } from 'src/modules/common/enums/operacion-ajuste.enum';

function instanciar(payload: Record<string, unknown>): ActualizacionPrecioDto {
  const dto = new ActualizacionPrecioDto();
  Object.assign(dto, payload);
  return dto;
}

describe('ActualizacionPrecioDto', () => {
  it('CP - Rechazar una actualización sin monto ni porcentaje', async () => {
    const errors = await validate(instanciar({}));

    expect(errors.length).toBeGreaterThan(0);
    const propiedades = errors.map((e) => e.property);
    expect(propiedades).toEqual(
      expect.arrayContaining(['tipoAjuste', 'operacion', 'valor']),
    );
  });

  it.each([
    {
      tipoAjuste: TipoAumento.MONTO_FIJO,
      operacion: OperacionAjuste.AUMENTO,
      valor: 0,
    },
    {
      tipoAjuste: TipoAumento.MONTO_FIJO,
      operacion: OperacionAjuste.AUMENTO,
      valor: -10,
    },
    {
      tipoAjuste: TipoAumento.PORCENTAJE,
      operacion: OperacionAjuste.AUMENTO,
      valor: 0,
    },
    {
      tipoAjuste: TipoAumento.PORCENTAJE,
      operacion: OperacionAjuste.AUMENTO,
      valor: -10,
    },
  ])(
    'CP - Rechazar un valor de ajuste no positivo ($tipoAjuste $valor)',
    async (payload) => {
      const errors = await validate(instanciar(payload));

      const errorDeValor = errors.find((e) => e.property === 'valor');
      expect(errorDeValor?.constraints?.isPositive).toBeDefined();
    },
  );
});
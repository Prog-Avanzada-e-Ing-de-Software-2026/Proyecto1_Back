import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { ProductoIntrinsicValidationService } from '../../domain/services/producto-intrinsic-validation.service.ts';

/**
 * Casos de prueba de registro y actualización de producto a nivel de servicio
 * (sin Docker).
 *
 * CR-001 hardena la validación intrínseca de Producto: `costo` >= 0,
 * `porcentaje` (margen) > 0, `stock` (stockActual) > 0 y `stockMinimo`
 * (stockMínimo) > 0 son obligatorios en el estado de la petición, junto con
 * `denominacion`, `marcaId`, `lineaId` y `presentacionId`. Los once casos de
 * rechazo deben lanzar `BadRequestException` y evitar que se invoque
 * `repo.create` / `repo.update`.
 */
const marca = { id: 1, denominacion: 'Coca-Cola' };
const linea = { id: 1, denominacion: 'Gaseosas' };
const presentacionActiva = { id: 1, denominacion: 'Botella 1 L' };
const usuarioValido = { id: 1, mail: 'admin@test.com' };

const dtoValido = {
  denominacion: 'coca-cola gaseosas botella 1 l',
  costo: 100,
  porcentaje: 20,
  stock: 10,
  stockMinimo: 5,
  marcaId: 1,
  lineaId: 1,
  presentacionId: 1,
  alicuotaIva: 21,
  utilizaStockMinimo: true,
  utilizaPack: false,
  usuarioCreatedId: 1,
};

const dtoUpdateBase = {
  denominacion: 'coca-cola gaseosas botella 1 l',
  usuarioUpdatedId: 1,
  costo: 100,
  porcentaje: 20,
  stock: 10,
  stockMinimo: 5,
  marcaId: 1,
  lineaId: 1,
  presentacionId: 1,
};

const productoExistente = {
  id: 1,
  denominacion: 'coca-cola gaseosas botella 1 l',
  costo: 100,
  porcentaje: 20,
  stock: 10,
  stockMinimo: 5,
  marcaId: 1,
  lineaId: 1,
  presentacionId: 1,
  alicuotaIva: 21,
  utilizaStockMinimo: true,
  utilizaPack: false,
  usuarioCreatedId: 1,
};

function omitir<T extends object>(objeto: T, clave: string): Partial<T> {
  return Object.fromEntries(
    Object.entries(objeto).filter(([k]) => k !== clave),
  ) as Partial<T>;
}

function crearRepo() {
  return {
    create: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    findBy: jest.fn(),
    actualizarPrecios: jest.fn(),
  } as any;
}

function crearService(repo: any) {
  return new ProductoService(
    repo,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    new ProductoIntrinsicValidationService(),
    { validarEntidadesRelacionadas: jest.fn() } as any,
    {
      validarYObtenerEntidadesRelacionadas: jest
        .fn()
        .mockResolvedValue({ marca, linea }),
    } as any,
    {
      validarDenominacionUnica: jest.fn().mockResolvedValue(undefined),
      validarCodigoProveedorUnico: jest.fn().mockResolvedValue(undefined),
    } as any,
    { validarUsuarioExiste: jest.fn().mockResolvedValue(usuarioValido) } as any,
    {} as any,
    { findOne: jest.fn().mockResolvedValue(presentacionActiva) } as any,
  );
}

describe('ProductoService - registro y actualización de producto', () => {
  it('CP - Registrar un producto con todos sus datos válidos', async () => {
    const repo = crearRepo();
    const service = crearService(repo);
    repo.create.mockResolvedValue({
      id: 1,
      denominacion: dtoValido.denominacion,
    });

    const resultado = await service.create(dtoValido as any);

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.create).toHaveBeenCalledWith(
      dtoValido,
      linea,
      marca,
      presentacionActiva,
      usuarioValido,
    );
    expect(resultado.mensaje).toContain('Producto creada');
    expect(resultado.mensaje).toContain(dtoValido.denominacion);
  });

  it.each([
    // [nombre del campo según el documento fuente, campo del modelo, fragmento del mensaje]
    ['costo', 'costo', 'costo'],
    ['margen', 'porcentaje', 'margen'],
    ['stockActual', 'stock', 'stockActual'],
    ['stockMínimo', 'stockMinimo', 'stockMínimo'],
    ['marca', 'marcaId', 'Marca ID es requerido y debe ser válido'],
    ['línea', 'lineaId', 'Línea ID es requerido y debe ser válido'],
    ['presentación', 'presentacionId', 'Presentación ID es requerido y debe ser válido'],
    ['denominación', 'denominacion', 'La denominación es obligatoria'],
  ] as const)(
    'CP - Rechazar el registro sin %s (no se guarda el producto)',
    async (nombreCampo, campoOmitido, fragmentoMensaje) => {
      const repo = crearRepo();
      const service = crearService(repo);
      repo.create.mockResolvedValue({ id: 1 });
      const dtoIncompleto = omitir(dtoValido, campoOmitido);

      const error = await service
        .create(dtoIncompleto as any)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).message).toContain(fragmentoMensaje);
      expect(repo.create).not.toHaveBeenCalled();
    },
  );

  it.each([
    // Valor inválido de la tabla CP-20: [campo del documento, campo del modelo, valor]
    ['costo', 'costo', -1],
    ['margen', 'porcentaje', 0],
    ['margen', 'porcentaje', -1],
    ['stockActual', 'stock', 0],
    ['stockActual', 'stock', -1],
    ['stockMínimo', 'stockMinimo', 0],
    ['stockMínimo', 'stockMinimo', -1],
  ] as const)(
    'CP - Rechazar el registro con %s inválido (%s) (no se guarda el producto)',
    async (nombreCampo, campoModelo, valorInvalido) => {
      const repo = crearRepo();
      const service = crearService(repo);
      repo.create.mockResolvedValue({ id: 1 });
      const dtoInvalido = { ...dtoValido, [campoModelo]: valorInvalido };

      const error = await service
        .create(dtoInvalido as any)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).message).toContain(nombreCampo);
      expect(repo.create).not.toHaveBeenCalled();
    },
  );

  it('CP - Aceptar costo igual a cero al registrar', async () => {
    const repo = crearRepo();
    const service = crearService(repo);
    repo.create.mockResolvedValue({ id: 1, denominacion: dtoValido.denominacion });
    const dto = { ...dtoValido, costo: 0 };

    const resultado = await service.create(dto as any);

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(resultado.mensaje).toContain('Producto creada');
  });

  it('CP - Rechazar una actualización de un producto inexistente', async () => {
    const repo = crearRepo();
    const service = crearService(repo);
    repo.findOne.mockResolvedValue(null);

    const error = await service
      .update(99999, dtoUpdateBase as any)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).message).toContain('no encontrado');
    expect(repo.update).not.toHaveBeenCalled();
  });
});
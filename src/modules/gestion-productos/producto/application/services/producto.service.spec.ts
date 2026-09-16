import { NotFoundException } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { IProductoRepository } from '../../domain/interfaces/producto.repository-interface';
import { Producto } from '../../domain/entities/producto.entity';
import { Presentacion } from '../../../presentacion/domain/entities/presentacion.entity';
import { Linea } from '../../../linea/domain/entities/linea.entity';
import { Marca } from '../../../marca/domain/entities/marca.entity';
import { AlicuotaIva } from 'src/modules/organizacion/enums/alicuota-iva.enum';

describe('ProductoService Presentacion association', () => {
  let repository: jest.Mocked<IProductoRepository>;
  let presentacionRepository: { findOne: jest.Mock };
  let relatedEntitiesValidator: {
    validarYObtenerEntidadesRelacionadas: jest.Mock;
  };
  let uniquenessValidator: {
    validarDenominacionUnica: jest.Mock;
    validarCodigoProveedorUnico: jest.Mock;
  };
  let usuarioValidator: { validarUsuarioExiste: jest.Mock };
  let intrinsicValidationService: { validarDatosBasicos: jest.Mock };
  let validationService: { validarEntidadesRelacionadas: jest.Mock };
  let service: ProductoService;

  const presentacion = (id = 10): Presentacion =>
    Object.assign(new Presentacion(), {
      id,
      denominacion: id === 10 ? '1l' : `Presentacion ${id}`,
    });

  const linea = (): Linea =>
    Object.assign(new Linea(), { id: 1, denominacion: 'Gaseosas' });

  const marca = (): Marca =>
    Object.assign(new Marca(), { id: 2, denominacion: 'Coca-Cola' });

  const producto = (parent = presentacion()): Producto =>
    Object.assign(new Producto(), {
      id: 1,
      denominacion: 'coca-cola 1l',
      linea: linea(),
      lineaId: 1,
      marca: marca(),
      marcaId: 2,
      presentacion: parent,
      presentacionId: parent.id,
      alicuotaIva: AlicuotaIva.ALICUOTA_21,
      utilizaStockMinimo: false,
      stockMinimo: 0,
      utilizaPack: false,
      cantidadPorPack: 0,
      stock: 0,
      sistema: 0,
    });

  const createDto = {
    denominacion: 'coca-cola 1l',
    utilizaStockMinimo: false,
    utilizaPack: false,
    lineaId: 1,
    marcaId: 2,
    presentacionId: 10,
    alicuotaIva: AlicuotaIva.ALICUOTA_21,
    precio: 100,
    usuarioCreatedId: 7,
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      findBy: jest.fn(),
      findByRapido: jest.fn(),
      findByDenominacionCodigoProveedorFiltered: jest.fn(),
      findByIdConAuditoria: jest.fn(),
      findByDenominacion: jest.fn(),
      findByIdWithoutRelations: jest.fn(),
      updateEntity: jest.fn(),
      actualizarPrecio: jest.fn(),
      actualizarPrecios: jest.fn(),
      remove: jest.fn(),
      isCodigoProveedorDuplicado: jest.fn(),
      existsByDenominacion: jest.fn(),
      existsByCodigoProveedor: jest.fn(),
      existsProductosActivosByMarca: jest.fn(),
      existsProductosActivosByLinea: jest.fn(),
      existsActiveByPresentacion: jest.fn(),
      findByIds: jest.fn(),
    } as unknown as jest.Mocked<IProductoRepository>;
    presentacionRepository = { findOne: jest.fn() };
    relatedEntitiesValidator = {
      validarYObtenerEntidadesRelacionadas: jest.fn().mockResolvedValue({
        marca: marca(),
        linea: linea(),
      }),
    };
    uniquenessValidator = {
      validarDenominacionUnica: jest.fn().mockResolvedValue(undefined),
      validarCodigoProveedorUnico: jest.fn().mockResolvedValue(undefined),
    };
    usuarioValidator = {
      validarUsuarioExiste: jest.fn().mockResolvedValue({ id: 7 }),
    };
    intrinsicValidationService = {
      validarDatosBasicos: jest.fn(),
    };
    validationService = {
      validarEntidadesRelacionadas: jest.fn(),
    };

    service = new ProductoService(
      repository,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      intrinsicValidationService as any,
      validationService as any,
      relatedEntitiesValidator as any,
      uniquenessValidator as any,
      usuarioValidator as any,
      {} as any,
      presentacionRepository as any,
    );
  });

  it('creates with an active Presentacion', async () => {
    const active = presentacion();
    presentacionRepository.findOne.mockResolvedValue(active);
    repository.create.mockResolvedValue(producto(active));

    await expect(service.create(createDto as any)).resolves.toEqual({
      mensaje: 'Producto creada con éxito con denominacion: coca-cola 1l',
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ presentacionId: 10 }),
      expect.anything(),
      expect.anything(),
      active,
      expect.anything(),
    );
  });

  it.each([98, 99])(
    'rejects creation when Presentacion %i is missing or deleted',
    async (presentacionId) => {
      presentacionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({ ...createDto, presentacionId } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.create).not.toHaveBeenCalled();
    },
  );

  it('preserves the association when update omits presentacionId', async () => {
    repository.findOne.mockResolvedValue(producto());
    repository.update.mockResolvedValue(producto());

    await service.update(1, {
      denominacion: 'coca-cola 1l',
      usuarioUpdatedId: 8,
    } as any);

    expect(presentacionRepository.findOne).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(
      1,
      expect.not.objectContaining({ presentacionId: expect.anything() }),
      expect.anything(),
      expect.anything(),
      undefined,
      expect.anything(),
    );
  });

  it('reassigns only to an active Presentacion', async () => {
    const newParent = presentacion(20);
    repository.findOne.mockResolvedValue(producto());
    presentacionRepository.findOne.mockResolvedValue(newParent);
    repository.update.mockResolvedValue(producto(newParent));

    await service.update(1, {
      denominacion: 'coca-cola 1l',
      presentacionId: 20,
      usuarioUpdatedId: 8,
    } as any);

    expect(repository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ presentacionId: 20 }),
      expect.anything(),
      expect.anything(),
      newParent,
      expect.anything(),
    );
  });

  it('rejects reassignment to a missing or deleted Presentacion', async () => {
    repository.findOne.mockResolvedValue(producto());
    presentacionRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update(1, {
        denominacion: 'coca-cola 1l',
        presentacionId: 99,
        usuarioUpdatedId: 8,
      } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('returns the reduced association from detail and search reads', async () => {
    repository.findOne.mockResolvedValue(producto());
    repository.findBy.mockResolvedValue({ data: [producto()], total: 1 });
    const expected = { id: 10, denominacion: '1l' };

    await expect(service.findDtoById(1)).resolves.toEqual(
      expect.objectContaining({ presentacion: expected }),
    );
    await expect(
      service.findBy('', '', false, '', 0, 0, 0, false, 0, 10),
    ).resolves.toEqual(
      expect.objectContaining({
        data: [expect.objectContaining({ presentacion: expected })],
      }),
    );
  });
});

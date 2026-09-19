import { ConflictException, NotFoundException } from '@nestjs/common';
import { SelectOption } from 'src/modules/common/interface/select-option';
import { ILineaRepository } from '../../domain/interfaces/linea.repository.interface';
import { Linea } from '../../domain/entities/linea.entity';
import { SuperLinea } from '../../../superlinea/domain/entities/superlinea.entity';
import { LineaMapper } from '../../mappers/linea.mapper';
import { LineaService } from './linea.service';

describe('LineaService - asociación con SuperLínea', () => {
  let repository: jest.Mocked<ILineaRepository>;
  let superLineaRepository: { findOne: jest.Mock };
  let service: LineaService;
  let deletionPolicy: { tieneProductosActivosParaLinea: jest.Mock };
  let usuarioService: { findOne: jest.Mock };

  const parent = (id = 10): SuperLinea =>
    Object.assign(new SuperLinea(), { id, denominacion: `Parent ${id}` });
  const line = (superLinea = parent()): Linea =>
    Object.assign(new Linea(), {
      id: 1,
      denominacion: 'Herramientas',
      utilizaStockMinimo: false,
      stockMinimo: 0,
      observacion: undefined,
      sistema: 0,
      deletedAt: undefined,
      superLinea,
      superLineaId: superLinea.id,
    });

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      update: jest.fn(),
      findAllFor: jest.fn(),
      findAllListado: jest.fn(),
      findAllSinSistemaFor: jest.fn(),
      existsActiveBySuperLinea: jest.fn(),
      findOne: jest.fn(),
      findByDenominacion: jest.fn(),
      findByDenominacionWith: jest.fn(),
      findByDenominacionFiltered: jest.fn(),
      findByIdConAuditoria: jest.fn(),
      busquedaPorCoincidenciaParcial: jest.fn(),
      remove: jest.fn(),
    };
    superLineaRepository = { findOne: jest.fn() };
    deletionPolicy = { tieneProductosActivosParaLinea: jest.fn() };
    usuarioService = { findOne: jest.fn() };
    service = new (LineaService as any)(
      repository,
      deletionPolicy,
      usuarioService,
      superLineaRepository,
    );
  });

  it('CP-47 - Registra con una única SuperLínea activa y devuelve la asociación reducida', async () => {
    const activeParent = parent();
    superLineaRepository.findOne.mockResolvedValue(activeParent);
    repository.findByDenominacionWith.mockResolvedValue(null);
    repository.create.mockResolvedValue(line(activeParent));

    await expect(
      service.create({
        denominacion: 'Herramientas',
        utilizaStockMinimo: false,
        usuarioCreatedId: 7,
        deletedAt: null,
        superLineaId: 10,
      }),
    ).resolves.toEqual(
      expect.objectContaining({ superLinea: { id: 10, denominacion: 'Parent 10' } }),
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ superLineaId: 10 }),
      activeParent,
    );
  });

  it.each([98, 99])(
    'CP-48 - Rechaza el registro cuando la SuperLínea %i no existe o está eliminada',
    async (superLineaId) => {
      repository.findByDenominacionWith.mockResolvedValue(null);
      superLineaRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          denominacion: 'Invalid',
          utilizaStockMinimo: false,
          usuarioCreatedId: 7,
          deletedAt: null,
          superLineaId,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.create).not.toHaveBeenCalled();
    },
  );

  it('CP-51 - Conserva la asociación cuando la modificación omite superLineaId', async () => {
    repository.findOne.mockResolvedValue(line());
    repository.update.mockResolvedValue(line());

    await service.update(1, { observacion: 'Updated', usuarioUpdatedId: 8 });

    expect(superLineaRepository.findOne).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(
      1,
      expect.not.objectContaining({ superLineaId: expect.anything() }),
      undefined,
    );
  });

  it('CP-50 - Reasigna únicamente a una SuperLínea activa', async () => {
    const newParent = parent(20);
    repository.findOne.mockResolvedValue(line());
    superLineaRepository.findOne.mockResolvedValue(newParent);
    repository.update.mockResolvedValue(line(newParent));

    await service.update(1, { superLineaId: 20, usuarioUpdatedId: 8 });

    expect(repository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ superLineaId: 20 }),
      newParent,
    );
  });

  it('CP-52 - Rechaza la reasignación a una SuperLínea inexistente o eliminada', async () => {
    repository.findOne.mockResolvedValue(line());
    superLineaRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update(1, { superLineaId: 99, usuarioUpdatedId: 8 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('CP-54 - Devuelve la asociación reducida con la SuperLínea en el detalle', async () => {
    repository.findOne.mockResolvedValue(line());
    repository.findByDenominacionFiltered.mockResolvedValue({ data: [line()], total: 1 });
    repository.findAllFor.mockResolvedValue([line()]);
    const expected = { id: 10, denominacion: 'Parent 10' };

    await expect(service.findDtoById(1)).resolves.toEqual(
      expect.objectContaining({ superLinea: expected }),
    );
    await expect(service.findByDenominacionFiltered('', 0, 10)).resolves.toEqual(
      expect.objectContaining({ data: [expect.objectContaining({ superLinea: expected })] }),
    );
    await expect(service.findAllFor('')).resolves.toEqual(
      expect.objectContaining({ data: [expect.objectContaining({ superLinea: expected })] }),
    );
  });

  it('CP-53 - Rechaza una denominación reservada por otra Línea activa o eliminada', async () => {
    repository.findOne.mockResolvedValue(line());
    repository.findByDenominacionWith.mockResolvedValue(
      Object.assign(line(parent(20)), { id: 2 }),
    );

    await expect(
      service.update(1, { denominacion: 'Máquinas', usuarioUpdatedId: 8 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('CP-49 - Rechaza el registro con una denominación reservada por una Línea activa o eliminada', async () => {
    repository.findByDenominacionWith.mockResolvedValue(line());

    await expect(
      service.create({
        denominacion: 'maquinas',
        utilizaStockMinimo: false,
        usuarioCreatedId: 7,
        deletedAt: null,
        superLineaId: 10,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(superLineaRepository.findOne).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('CP-53 - Permite conservar la denominación actual', async () => {
    const current = line();
    repository.findOne.mockResolvedValue(current);
    repository.findByDenominacionWith.mockResolvedValue(current);
    repository.update.mockResolvedValue(current);

    await expect(
      service.update(1, { denominacion: 'Herramientas', usuarioUpdatedId: 8 }),
    ).resolves.toBeDefined();
  });

  it('CP-55 - Elimina lógicamente una Línea sin Productos activos', async () => {
    const current = line();
    const user = { id: 9 };
    repository.findOne.mockResolvedValue(current);
    usuarioService.findOne.mockResolvedValue(user);
    deletionPolicy.tieneProductosActivosParaLinea.mockResolvedValue(false);
    repository.remove.mockResolvedValue(current);

    await service.remove(1, 9);

    expect(repository.remove).toHaveBeenCalledWith(current, user);
  });

  it('CP-56 - Rechaza la eliminación cuando un Producto activo referencia la Línea', async () => {
    repository.findOne.mockResolvedValue(line());
    usuarioService.findOne.mockResolvedValue({ id: 9 });
    deletionPolicy.tieneProductosActivosParaLinea.mockResolvedValue(true);

    await expect(service.remove(1, 9)).rejects.toBeInstanceOf(ConflictException);
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it('No-CP - Mapea las entidades a la forma de selección (código, nombre y descripción)', async () => {
    const expected: SelectOption[] = [
      { codigo: 1, nombre: 'Harinas', descripcion: 'Harinas y derivados' },
    ];
    repository.busquedaPorCoincidenciaParcial.mockResolvedValue([
      Object.assign(line(), {
        id: 1,
        denominacion: 'Harinas',
        observacion: 'Harinas y derivados',
      }),
    ]);

    const result = await service.busquedaPorCoincidenciaParcial('harina');

    expect(result).toEqual(expected);
    expect(Object.keys(result[0]).sort()).toEqual([
      'codigo',
      'descripcion',
      'nombre',
    ]);
    expect(repository.busquedaPorCoincidenciaParcial).toHaveBeenCalledWith(
      'harina',
    );
  });
});

describe('LineaMapper.toSelectOption (No-CP)', () => {
  it('Mapea una Línea a la forma de selección (código, nombre y descripción)', () => {
    const entity = Object.assign(new Linea(), {
      id: 7,
      denominacion: 'Harinas',
      observacion: 'Harinas y derivados',
    });

    expect(LineaMapper.toSelectOption(entity)).toEqual({
      codigo: 7,
      nombre: 'Harinas',
      descripcion: 'Harinas y derivados',
    });
  });

  it('Una observación nula se transforma en una descripción vacía', () => {
    const entity = Object.assign(new Linea(), {
      id: 8,
      denominacion: 'Harinas',
      observacion: undefined,
    });

    expect(LineaMapper.toSelectOption(entity)).toEqual({
      codigo: 8,
      nombre: 'Harinas',
      descripcion: '',
    });
  });
});

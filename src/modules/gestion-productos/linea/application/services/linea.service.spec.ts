import { NotFoundException } from '@nestjs/common';
import { ILineaRepository } from '../../domain/interfaces/linea.repository.interface';
import { Linea } from '../../domain/entities/linea.entity';
import { SuperLinea } from '../../../superlinea/domain/entities/superlinea.entity';
import { LineaService } from './linea.service';

describe('LineaService SuperLinea association', () => {
  let repository: jest.Mocked<ILineaRepository>;
  let superLineaRepository: { findOne: jest.Mock };
  let service: LineaService;

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
      remove: jest.fn(),
    };
    superLineaRepository = { findOne: jest.fn() };
    service = new (LineaService as any)(
      repository,
      { tieneProductosActivosParaLinea: jest.fn() },
      { findOne: jest.fn() },
      superLineaRepository,
    );
  });

  it('creates with an active SuperLinea and returns the reduced association', async () => {
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
    'rejects creation when SuperLinea %i is missing or deleted',
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

  it('preserves the association when update omits superLineaId', async () => {
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

  it('reassigns only to an active SuperLinea', async () => {
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

  it('rejects reassignment to a missing or deleted SuperLinea', async () => {
    repository.findOne.mockResolvedValue(line());
    superLineaRepository.findOne.mockResolvedValue(null);

    await expect(
      service.update(1, { superLineaId: 99, usuarioUpdatedId: 8 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('returns the reduced association from detail, search and selector reads', async () => {
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
});

import { ConflictException, NotFoundException } from '@nestjs/common';
import { SuperLineaService } from './superlinea.service';
import { ISuperLineaRepository } from '../../domain/interfaces/superlinea.repository.interface';
import { PoliticaEliminacionSuperLinea } from '../../domain/services/politica-eliminacion-superlinea.service';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { SuperLinea } from '../../domain/entities/superlinea.entity';

describe('SuperLineaService', () => {
  let service: SuperLineaService;
  let repository: jest.Mocked<ISuperLineaRepository>;
  let deletionPolicy: jest.Mocked<PoliticaEliminacionSuperLinea>;
  let usuarioService: jest.Mocked<Pick<UsuarioService, 'findOne'>>;

  const entity = (overrides: Partial<SuperLinea> = {}): SuperLinea =>
    Object.assign(new SuperLinea(), {
      id: 1,
      denominacion: 'Herramientas',
      observacion: undefined,
      lineas: [],
      createdAt: new Date('2026-09-10T10:00:00.000Z'),
      updatedAt: new Date('2026-09-10T10:00:00.000Z'),
      deletedAt: undefined,
      usuarioCreatedId: 7,
      usuarioUpdatedId: undefined,
      usuarioDeletedId: undefined,
      ...overrides,
    });

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      findByDenominacionWithDeleted: jest.fn(),
      findBy: jest.fn(),
      findAllFor: jest.fn(),
      findByIdConAuditoria: jest.fn(),
      remove: jest.fn(),
    };
    deletionPolicy = {
      tieneLineasActivas: jest.fn(),
    } as unknown as jest.Mocked<PoliticaEliminacionSuperLinea>;
    usuarioService = {
      findOne: jest.fn(),
    };
    service = new SuperLineaService(
      repository,
      usuarioService as unknown as UsuarioService,
      deletionPolicy,
    );
  });

  it('creates a unique active super line with its generated id', async () => {
    repository.findByDenominacionWithDeleted.mockResolvedValue(null);
    repository.create.mockResolvedValue(entity());

    await expect(
      service.create({ denominacion: 'Herramientas', usuarioCreatedId: 7 }),
    ).resolves.toEqual({
      mensaje:
        'SuperLínea creada con éxito con denominacion: Herramientas',
    });
    expect(repository.create).toHaveBeenCalledWith({
      denominacion: 'Herramientas',
      usuarioCreatedId: 7,
    });
  });

  it('accepts an omitted observation and preserves one when supplied', async () => {
    repository.findByDenominacionWithDeleted.mockResolvedValue(null);
    repository.create.mockResolvedValue(entity({ observacion: undefined }));
    repository.findOne.mockResolvedValue(entity());
    repository.update.mockResolvedValue(entity({ observacion: 'Industrial' }));

    await service.create({ denominacion: 'Herramientas', usuarioCreatedId: 7 });
    await service.update(1, {
      observacion: 'Industrial',
      usuarioUpdatedId: 8,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ observacion: expect.anything() }),
    );
    expect(repository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ observacion: 'Industrial' }),
    );
  });

  it('rejects creation with a denomination reserved by a deleted record', async () => {
    repository.findByDenominacionWithDeleted.mockResolvedValue(
      entity({ deletedAt: new Date('2026-09-09T10:00:00.000Z') }),
    );

    await expect(
      service.create({ denominacion: 'Herramientas', usuarioCreatedId: 7 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('allows an update that retains the entity own denomination', async () => {
    repository.findOne.mockResolvedValue(entity());
    repository.findByDenominacionWithDeleted.mockResolvedValue(entity());
    repository.update.mockResolvedValue(entity({ observacion: 'Updated' }));

    await expect(
      service.update(1, {
        denominacion: 'Herramientas',
        observacion: 'Updated',
        usuarioUpdatedId: 8,
      }),
    ).resolves.toEqual({
      mensaje:
        'SuperLínea editada con éxito con denominacion: Herramientas',
    });
  });

  it('passes the responsible user id when creating', async () => {
    repository.findByDenominacionWithDeleted.mockResolvedValue(null);
    repository.create.mockResolvedValue(entity());

    await service.create({ denominacion: 'Herramientas', usuarioCreatedId: 7 });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioCreatedId: 7 }),
    );
  });

  it('passes the responsible user id when updating', async () => {
    repository.findOne.mockResolvedValue(entity());
    repository.update.mockResolvedValue(
      entity({ usuarioUpdatedId: 8, updatedAt: new Date('2026-09-11') }),
    );

    await service.update(1, { observacion: 'Updated', usuarioUpdatedId: 8 });

    expect(repository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ usuarioUpdatedId: 8 }),
    );
  });

  it('passes the responsible user when logically deleting', async () => {
    const user = { id: 9 };
    repository.findOne.mockResolvedValue(entity());
    deletionPolicy.tieneLineasActivas.mockResolvedValue(false);
    usuarioService.findOne.mockResolvedValue(user as never);
    repository.remove.mockResolvedValue(
      entity({ deletedAt: new Date('2026-09-11'), usuarioDeletedId: 9 }),
    );

    await service.remove(1, 9);

    expect(repository.remove).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
      user,
    );
  });

  it('searches active records by default and returns the active total', async () => {
    repository.findBy.mockResolvedValue({ data: [entity()], total: 1 });

    await expect(service.findBy('herra', 0, 10)).resolves.toEqual({
      data: [
        {
          id: 1,
          denominacion: 'Herramientas',
          observacion: '',
          deletedAt: null,
        },
      ],
      total: 1,
    });
    expect(repository.findBy).toHaveBeenCalledWith('herra', 0, 10, false);
  });

  it('searches active and deleted records when requested', async () => {
    const deleted = entity({
      id: 2,
      denominacion: 'Herramientas eléctricas',
      deletedAt: new Date('2026-09-09T10:00:00.000Z'),
    });
    repository.findBy.mockResolvedValue({ data: [entity(), deleted], total: 2 });

    const result = await service.findBy('herra', 0, 10, true);

    expect(result.total).toBe(2);
    expect(result.data[1].deletedAt).toBe('2026-09-09T10:00:00.000Z');
    expect(repository.findBy).toHaveBeenCalledWith('herra', 0, 10, true);
  });

  it('returns only active selector records and their actual count', async () => {
    repository.findAllFor.mockResolvedValue([
      entity(),
      entity({ id: 2, denominacion: 'Máquinas' }),
    ]);

    await expect(service.findAllFor('')).resolves.toEqual({
      data: [
        expect.objectContaining({ id: 1, denominacion: 'Herramientas' }),
        expect.objectContaining({ id: 2, denominacion: 'Máquinas' }),
      ],
      total: 2,
    });
  });

  it('returns a stable empty collection result', async () => {
    repository.findBy.mockResolvedValue({ data: [], total: 0 });
    repository.findAllFor.mockResolvedValue([]);

    await expect(service.findBy('missing', 0, 10)).resolves.toEqual({
      data: [],
      total: 0,
    });
    await expect(service.findAllFor('missing')).resolves.toEqual({
      data: [],
      total: 0,
    });
  });

  it('rejects deletion while an active line references the super line', async () => {
    repository.findOne.mockResolvedValue(entity());
    deletionPolicy.tieneLineasActivas.mockResolvedValue(true);

    await expect(service.remove(1, 9)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(usuarioService.findOne).not.toHaveBeenCalled();
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it('deletes immediately when only deleted lines reference the super line', async () => {
    const user = { id: 9 };
    repository.findOne.mockResolvedValue(entity());
    deletionPolicy.tieneLineasActivas.mockResolvedValue(false);
    usuarioService.findOne.mockResolvedValue(user as never);
    repository.remove.mockResolvedValue(entity({ usuarioDeletedId: 9 }));

    await expect(service.remove(1, 9)).resolves.toEqual({
      mensaje:
        'SuperLínea eliminada con éxito con denominacion: Herramientas',
    });
  });

  it('reports missing records consistently for detail and audit queries', async () => {
    repository.findOne.mockResolvedValue(null);
    repository.findByIdConAuditoria.mockResolvedValue(null);

    await expect(service.findDtoById(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.findByIdConAuditoria(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

import { ConflictException, NotFoundException } from '@nestjs/common';
import { PresentacionService } from './presentacion.service';
import { IPresentacionRepository } from '../../domain/interfaces/presentacion.repository.interface';
import { PoliticaEliminacionPresentacion } from '../../domain/services/politica-eliminacion-presentacion.service';
import { PoliticaCreacionPresentacion } from '../../domain/services/politica-creacion-presentacion.service';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { Presentacion } from '../../domain/entities/presentacion.entity';

describe('PresentacionService', () => {
  let service: PresentacionService;
  let repository: jest.Mocked<IPresentacionRepository>;
  let deletionPolicy: jest.Mocked<PoliticaEliminacionPresentacion>;
  let createPolicy: PoliticaCreacionPresentacion;
  let usuarioService: jest.Mocked<Pick<UsuarioService, 'findOne'>>;

  const entity = (overrides: Partial<Presentacion> = {}): Presentacion =>
    Object.assign(new Presentacion(), {
      id: 1,
      denominacion: '1l',
      observacion: undefined,
      productos: [],
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
      tieneProductosActivos: jest.fn(),
    } as unknown as jest.Mocked<PoliticaEliminacionPresentacion>;
    createPolicy = new PoliticaCreacionPresentacion(repository);
    usuarioService = {
      findOne: jest.fn(),
    };
    service = new PresentacionService(
      repository,
      usuarioService as unknown as UsuarioService,
      deletionPolicy,
      createPolicy,
    );
  });

  it('creates a unique active presentation with its generated id', async () => {
    repository.findByDenominacionWithDeleted.mockResolvedValue(null);
    repository.create.mockResolvedValue(entity());

    await expect(
      service.create({ denominacion: '1l', usuarioCreatedId: 7 }),
    ).resolves.toEqual({
      mensaje: 'Presentación creada con éxito con denominacion: 1l',
    });
    expect(repository.create).toHaveBeenCalledWith({
      denominacion: '1l',
      usuarioCreatedId: 7,
    });
  });

  it('accepts an omitted observation and preserves one when supplied', async () => {
    repository.findByDenominacionWithDeleted.mockResolvedValue(null);
    repository.create.mockResolvedValue(entity({ observacion: undefined }));
    repository.findOne.mockResolvedValue(entity());
    repository.update.mockResolvedValue(entity({ observacion: 'Botella' }));

    await service.create({ denominacion: '1l', usuarioCreatedId: 7 });
    await service.update(1, {
      observacion: 'Botella',
      usuarioUpdatedId: 8,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ observacion: expect.anything() }),
    );
    expect(repository.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ observacion: 'Botella' }),
    );
  });

  it('rejects creation with a denomination reserved by a deleted record', async () => {
    repository.findByDenominacionWithDeleted.mockResolvedValue(
      entity({ deletedAt: new Date('2026-09-09T10:00:00.000Z') }),
    );

    await expect(
      service.create({ denominacion: '1l', usuarioCreatedId: 7 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('allows an update that retains the entity own denomination', async () => {
    repository.findOne.mockResolvedValue(entity());
    repository.findByDenominacionWithDeleted.mockResolvedValue(entity());
    repository.update.mockResolvedValue(entity({ observacion: 'Updated' }));

    await expect(
      service.update(1, {
        denominacion: '1l',
        observacion: 'Updated',
        usuarioUpdatedId: 8,
      }),
    ).resolves.toEqual({
      mensaje: 'Presentación editada con éxito con denominacion: 1l',
    });
  });

  it('passes the responsible user id when creating', async () => {
    repository.findByDenominacionWithDeleted.mockResolvedValue(null);
    repository.create.mockResolvedValue(entity());

    await service.create({ denominacion: '1l', usuarioCreatedId: 7 });

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
    deletionPolicy.tieneProductosActivos.mockResolvedValue(false);
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

    await expect(
      service.findBy({
        denominacion: '1l',
        skip: 0,
        take: 10,
        incluirEliminados: false,
      }),
    ).resolves.toEqual({
      data: [
        {
          id: 1,
          denominacion: '1l',
          observacion: '',
          deletedAt: null,
        },
      ],
      total: 1,
    });
    expect(repository.findBy).toHaveBeenCalledWith({
      denominacion: '1l',
      skip: 0,
      take: 10,
      incluirEliminados: false,
    });
  });

  it('searches active and deleted records when requested', async () => {
    const deleted = entity({
      id: 2,
      denominacion: 'pack',
      deletedAt: new Date('2026-09-09T10:00:00.000Z'),
    });
    repository.findBy.mockResolvedValue({
      data: [entity(), deleted],
      total: 2,
    });

    const result = await service.findBy({
      denominacion: 'p',
      skip: 0,
      take: 10,
      incluirEliminados: true,
    });

    expect(result.total).toBe(2);
    expect(result.data[1].deletedAt).toBe('2026-09-09T10:00:00.000Z');
    expect(repository.findBy).toHaveBeenCalledWith({
      denominacion: 'p',
      skip: 0,
      take: 10,
      incluirEliminados: true,
    });
  });

  it('returns only active selector records and their actual count', async () => {
    repository.findAllFor.mockResolvedValue([
      entity(),
      entity({ id: 2, denominacion: 'pack' }),
    ]);

    await expect(service.findAllFor('')).resolves.toEqual({
      data: [
        expect.objectContaining({ id: 1, denominacion: '1l' }),
        expect.objectContaining({ id: 2, denominacion: 'pack' }),
      ],
      total: 2,
    });
  });

  it('returns a stable empty collection result', async () => {
    repository.findBy.mockResolvedValue({ data: [], total: 0 });
    repository.findAllFor.mockResolvedValue([]);

    await expect(
      service.findBy({
        denominacion: 'missing',
        skip: 0,
        take: 10,
        incluirEliminados: false,
      }),
    ).resolves.toEqual({
      data: [],
      total: 0,
    });
    await expect(service.findAllFor('missing')).resolves.toEqual({
      data: [],
      total: 0,
    });
  });

  it('rejects deletion while an active product references the presentation', async () => {
    repository.findOne.mockResolvedValue(entity());
    deletionPolicy.tieneProductosActivos.mockResolvedValue(true);

    await expect(service.remove(1, 9)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(usuarioService.findOne).not.toHaveBeenCalled();
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it('deletes when no active products reference the presentation', async () => {
    const user = { id: 9 };
    repository.findOne.mockResolvedValue(entity());
    deletionPolicy.tieneProductosActivos.mockResolvedValue(false);
    usuarioService.findOne.mockResolvedValue(user as never);
    repository.remove.mockResolvedValue(entity({ usuarioDeletedId: 9 }));

    await expect(service.remove(1, 9)).resolves.toEqual({
      mensaje: 'Presentación eliminada con éxito con denominacion: 1l',
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

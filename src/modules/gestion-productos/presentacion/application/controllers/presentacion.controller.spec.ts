import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { PresentacionController } from './presentacion.controller';
import { PresentacionService } from '../services/presentacion.service';
import { NormalizeDenominacionPipe } from 'src/modules/common/pipes/normalize-denominations.pipe';
import { NormalizeDenominacionSearchPipe } from 'src/modules/common/pipes/normalize-denominations-search.pipe';

describe('PresentacionController', () => {
  let app: INestApplication;

  const service = {
    create: jest.fn(),
    findBy: jest.fn(),
    findAllFor: jest.fn(),
    findDtoById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByIdConAuditoria: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [PresentacionController],
      providers: [
        { provide: PresentacionService, useValue: service },
        NormalizeDenominacionPipe,
        NormalizeDenominacionSearchPipe,
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => app.close());

  it('routes create, update and delete requests with audit user ids', async () => {
    service.create.mockResolvedValue({ mensaje: 'created' });
    service.update.mockResolvedValue({ mensaje: 'updated' });
    service.remove.mockResolvedValue({ mensaje: 'deleted' });

    await request(app.getHttpServer())
      .post('/api/presentacion')
      .send({ denominacion: '1L', usuarioCreatedId: 7 })
      .expect(201, { mensaje: 'created' });
    await request(app.getHttpServer())
      .put('/api/presentacion/1')
      .send({ observacion: 'Botella', usuarioUpdatedId: 8 })
      .expect(200, { mensaje: 'updated' });
    await request(app.getHttpServer())
      .delete('/api/presentacion/1?usuarioId=9')
      .expect(200, { mensaje: 'deleted' });

    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({
        denominacion: '1L',
        usuarioCreatedId: 7,
      }),
    );
    expect(service.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ usuarioUpdatedId: 8 }),
    );
    expect(service.remove).toHaveBeenCalledWith(1, 9);
  });

  it('routes detail, audit, search and selector queries', async () => {
    service.findDtoById.mockResolvedValue({ id: 1, denominacion: '1L' });
    service.findByIdConAuditoria.mockResolvedValue({ id: 1 });
    service.findBy.mockResolvedValue({ data: [], total: 0 });
    service.findAllFor.mockResolvedValue({ data: [], total: 0 });

    await request(app.getHttpServer()).get('/api/presentacion/1').expect(200);
    await request(app.getHttpServer())
      .get('/api/presentacion/1/audit')
      .expect(200);
    await request(app.getHttpServer())
      .get(
        '/api/presentacion/search-by?denominacion=1l&skip=2&take=5&incluirEliminados=true',
      )
      .expect(200, { data: [], total: 0 });
    await request(app.getHttpServer())
      .get('/api/presentacion/select?denominacion=1l')
      .expect(200, { data: [], total: 0 });
    await request(app.getHttpServer())
      .get('/api/presentacion/select')
      .expect(200, { data: [], total: 0 });

    expect(service.findBy).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 2,
        take: 5,
        incluirEliminados: true,
      }),
    );
    expect(service.findAllFor).toHaveBeenCalled();
    expect(service.findDtoById).toHaveBeenCalledWith(1);
    expect(service.findByIdConAuditoria).toHaveBeenCalledWith(1);
  });

  it('forbids rewriting creation audit data during an update', async () => {
    await request(app.getHttpServer())
      .put('/api/presentacion/1')
      .send({ usuarioCreatedId: 99, usuarioUpdatedId: 8 })
      .expect(400);

    expect(service.update).not.toHaveBeenCalled();
  });
});

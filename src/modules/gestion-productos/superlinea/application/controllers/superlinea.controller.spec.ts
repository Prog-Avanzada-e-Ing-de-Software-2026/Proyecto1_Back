import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { SuperLineaController } from './superlinea.controller';
import { SuperLineaService } from '../services/superlinea.service';

describe('SuperLineaController', () => {
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
      controllers: [SuperLineaController],
      providers: [{ provide: SuperLineaService, useValue: service }],
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
      .post('/api/superlinea')
      .send({ denominacion: 'Herramientas', usuarioCreatedId: 7 })
      .expect(201, { mensaje: 'created' });
    await request(app.getHttpServer())
      .put('/api/superlinea/1')
      .send({ observacion: 'Industrial', usuarioUpdatedId: 8 })
      .expect(200, { mensaje: 'updated' });
    await request(app.getHttpServer())
      .delete('/api/superlinea/1?usuarioId=9')
      .expect(200, { mensaje: 'deleted' });

    expect(service.create).toHaveBeenCalledWith({
      denominacion: 'HERRAMIENTAS',
      usuarioCreatedId: 7,
    });
    expect(service.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ usuarioUpdatedId: 8 }),
    );
    expect(service.remove).toHaveBeenCalledWith(1, 9);
  });

  it('routes detail, audit, search and selector queries', async () => {
    service.findDtoById.mockResolvedValue({ id: 1, denominacion: 'Herramientas' });
    service.findByIdConAuditoria.mockResolvedValue({ id: 1 });
    service.findBy.mockResolvedValue({ data: [], total: 0 });
    service.findAllFor.mockResolvedValue({ data: [], total: 0 });

    await request(app.getHttpServer()).get('/api/superlinea/1').expect(200);
    await request(app.getHttpServer()).get('/api/superlinea/1/audit').expect(200);
    await request(app.getHttpServer())
      .get('/api/superlinea/search-by?denominacion=herra&skip=2&take=5&incluirEliminados=true')
      .expect(200, { data: [], total: 0 });
    await request(app.getHttpServer())
      .get('/api/superlinea/select?denominacion=herra')
      .expect(200, { data: [], total: 0 });
    await request(app.getHttpServer())
      .get('/api/superlinea/select')
      .expect(200, { data: [], total: 0 });

    expect(service.findBy).toHaveBeenCalledWith('HERRA', 2, 5, true);
    expect(service.findAllFor).toHaveBeenCalledWith('HERRA');
    expect(service.findAllFor).toHaveBeenCalledWith('');
    expect(service.findDtoById).toHaveBeenCalledWith(1);
    expect(service.findByIdConAuditoria).toHaveBeenCalledWith(1);
  });

  it('forbids rewriting creation audit data during an update', async () => {
    await request(app.getHttpServer())
      .put('/api/superlinea/1')
      .send({ usuarioCreatedId: 99, usuarioUpdatedId: 8 })
      .expect(400);

    expect(service.update).not.toHaveBeenCalled();
  });
});

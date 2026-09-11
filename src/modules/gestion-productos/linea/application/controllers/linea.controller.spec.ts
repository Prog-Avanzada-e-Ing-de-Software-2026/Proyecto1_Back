import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { LineaController } from './linea.controller';
import { LineaService } from '../services/linea.service';

describe('LineaController SuperLinea contract', () => {
  let app: INestApplication;
  const service = {
    create: jest.fn(),
    update: jest.fn(),
    findDtoById: jest.fn(),
    findByDenominacionFiltered: jest.fn(),
    findByIdConAuditoria: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [LineaController],
      providers: [{ provide: LineaService, useValue: service }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterEach(async () => app.close());

  it('requires a non-null integer SuperLinea when creating a line', async () => {
    const base = {
      denominacion: 'Herramientas',
      utilizaStockMinimo: false,
      usuarioCreatedId: 7,
      deletedAt: null,
    };

    await request(app.getHttpServer()).post('/api/linea').send(base).expect(400);
    await request(app.getHttpServer())
      .post('/api/linea')
      .send({ ...base, superLineaId: null })
      .expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('accepts an active-parent id when creating', async () => {
    service.create.mockResolvedValue({ id: 1 });

    await request(app.getHttpServer())
      .post('/api/linea')
      .send({
        denominacion: 'Herramientas',
        utilizaStockMinimo: false,
        usuarioCreatedId: 7,
        deletedAt: null,
        superLineaId: 10,
      })
      .expect(201, { id: 1 });
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ superLineaId: 10 }),
    );
  });

  it('allows omission but rejects null when updating the association', async () => {
    service.update.mockResolvedValue({ mensaje: 'updated' });

    await request(app.getHttpServer())
      .put('/api/linea/1')
      .send({ utilizaStockMinimo: false, usuarioUpdatedId: 8 })
      .expect(200);
    await request(app.getHttpServer())
      .put('/api/linea/1')
      .send({ utilizaStockMinimo: false, usuarioUpdatedId: 8, superLineaId: null })
      .expect(400);
    expect(service.update).toHaveBeenCalledTimes(1);
  });
});

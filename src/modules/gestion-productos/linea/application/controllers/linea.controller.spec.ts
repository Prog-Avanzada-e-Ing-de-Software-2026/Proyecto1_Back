import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { LineaController } from './linea.controller';
import { LineaService } from '../services/linea.service';

describe('LineaController - contrato de asociación con SuperLínea', () => {
  let app: INestApplication;
  const service = {
    create: jest.fn(),
    update: jest.fn(),
    findDtoById: jest.fn(),
    findByDenominacionFiltered: jest.fn(),
    findByIdConAuditoria: jest.fn(),
    busquedaPorCoincidenciaParcial: jest.fn(),
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

  it('CP-48 - Rechaza el registro cuando falta la SuperLínea o es nula', async () => {
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

  it('CP-47 - Devuelve HTTP 201 al registrar una Línea válida', async () => {
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

  it('CP-51/CP-52 - Permite omitir la asociación pero rechaza el valor nulo al modificarla', async () => {
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

  it('CP-55 - Devuelve HTTP 200 al eliminar una Línea', async () => {
    service.remove.mockResolvedValue({ mensaje: 'deleted' });

    await request(app.getHttpServer())
      .delete('/api/linea/1?usuarioId=9')
      .expect(200, { mensaje: 'deleted' });

    expect(service.remove).toHaveBeenCalledWith(1, 9);
  });

  it('No-CP - /api/linea/select devuelve las opciones de selección (código, nombre y descripción)', async () => {
    service.busquedaPorCoincidenciaParcial.mockResolvedValue([
      { codigo: 1, nombre: 'Harinas', descripcion: '' },
    ]);

    await request(app.getHttpServer())
      .get('/api/linea/select?denominacion=harina')
      .expect(200, [{ codigo: 1, nombre: 'Harinas', descripcion: '' }]);
    expect(service.busquedaPorCoincidenciaParcial).toHaveBeenCalledWith(
      'harina',
    );
  });

  it('No-CP - Sin término, /api/linea/select devuelve una colección vacía', async () => {
    service.busquedaPorCoincidenciaParcial.mockResolvedValue([]);

    await request(app.getHttpServer())
      .get('/api/linea/select')
      .expect(200, []);
    expect(service.busquedaPorCoincidenciaParcial).toHaveBeenCalledWith('');
  });

  it('No-CP - Rechaza parámetros no admitidos en /api/linea/select', async () => {
    await request(app.getHttpServer())
      .get('/api/linea/select?desconocido=1')
      .expect(400);

    expect(service.busquedaPorCoincidenciaParcial).not.toHaveBeenCalled();
  });
});

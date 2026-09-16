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
    busquedaPorCoincidenciaParcial: jest.fn(),
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

  it('returns slim selection options for /api/superlinea/select', async () => {
    service.busquedaPorCoincidenciaParcial.mockResolvedValue([
      { codigo: 1, nombre: 'Almacén', descripcion: 'Productos varios' },
    ]);

    await request(app.getHttpServer())
      .get('/api/superlinea/select?denominacion=almacen')
      .expect(200, [{ codigo: 1, nombre: 'Almacén', descripcion: 'Productos varios' }]);
    expect(service.busquedaPorCoincidenciaParcial).toHaveBeenCalledWith(
      'almacen',
    );
  });

  it('passes an empty term and returns an empty array when denominacion is omitted', async () => {
    service.busquedaPorCoincidenciaParcial.mockResolvedValue([]);

    await request(app.getHttpServer())
      .get('/api/superlinea/select')
      .expect(200, []);
    expect(service.busquedaPorCoincidenciaParcial).toHaveBeenCalledWith('');
  });

  it('rejects non-whitelisted query params on /api/superlinea/select', async () => {
    await request(app.getHttpServer())
      .get('/api/superlinea/select?desconocido=1')
      .expect(400);

    expect(service.busquedaPorCoincidenciaParcial).not.toHaveBeenCalled();
  });

  it('routes detail and audit queries', async () => {
    service.findDtoById.mockResolvedValue({ id: 1, denominacion: 'Herramientas' });
    service.findByIdConAuditoria.mockResolvedValue({ id: 1 });

    await request(app.getHttpServer()).get('/api/superlinea/1').expect(200);
    await request(app.getHttpServer()).get('/api/superlinea/1/audit').expect(200);

    expect(service.findDtoById).toHaveBeenCalledWith(1);
    expect(service.findByIdConAuditoria).toHaveBeenCalledWith(1);
  });

  it('routes search-by with pagination DTO', async () => {
    service.findBy.mockResolvedValue({ data: [], total: 0 });

    await request(app.getHttpServer())
      .get('/api/superlinea/search-by?denominacion=herra&skip=2&take=5&incluirEliminados=true')
      .expect(200, { data: [], total: 0 });

    expect(service.findBy).toHaveBeenCalledWith(
      expect.objectContaining({
        denominacion: 'HERRA',
        skip: 2,
        take: 5,
        incluirEliminados: true,
      }),
    );
  });

  it('forbids rewriting creation audit data during an update', async () => {
    await request(app.getHttpServer())
      .put('/api/superlinea/1')
      .send({ usuarioCreatedId: 99, usuarioUpdatedId: 8 })
      .expect(400);

    expect(service.update).not.toHaveBeenCalled();
  });
});

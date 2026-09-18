import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { SuperLineaController } from './superlinea.controller';
import { SuperLineaService } from '../services/superlinea.service';
import { IsUniqueDenominacionConstraint } from '../../domain/validator/unique-denominacion.validator';

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
    jest
      .spyOn(IsUniqueDenominacionConstraint.prototype, 'validate')
      .mockResolvedValue(true);
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

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  it('CP-57 - returns HTTP 201 for a valid creation request', async () => {
    service.create.mockResolvedValue({ mensaje: 'created' });

    await request(app.getHttpServer())
      .post('/api/superlinea')
      .send({ denominacion: 'Bebidas', usuarioCreatedId: 7 })
      .expect(201, { mensaje: 'created' });
  });

  it('CP-61 - returns HTTP 200 with an empty paginated collection', async () => {
    service.findBy.mockResolvedValue({ data: [], total: 0 });

    await request(app.getHttpServer())
      .get('/api/superlinea/search-by?skip=0&take=10')
      .expect(200, { data: [], total: 0 });
  });

  it('CP-62 - returns HTTP 200 for a valid update request', async () => {
    service.update.mockResolvedValue({ mensaje: 'updated' });

    await request(app.getHttpServer())
      .put('/api/superlinea/1')
      .send({
        denominacion: 'Bebidas Sin Alcohol',
        observacion: 'Updated',
        usuarioUpdatedId: 8,
      })
      .expect(200, { mensaje: 'updated' });
  });

  it('CP-64 - returns HTTP 200 when deleting a super line', async () => {
    service.remove.mockResolvedValue({ mensaje: 'deleted' });

    await request(app.getHttpServer())
      .delete('/api/superlinea/1?usuarioId=9')
      .expect(200, { mensaje: 'deleted' });
  });

  it('CP-66 - returns HTTP 404 when requesting a deleted super line detail', async () => {
    service.findDtoById.mockRejectedValue(new NotFoundException());

    await request(app.getHttpServer())
      .get('/api/superlinea/99')
      .expect(404);
  });

  it('non-CP regression - /api/superlinea/select devuelve las opciones de selección (código, nombre y descripción)', async () => {
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

  it('non-CP regression - Sin término, /api/superlinea/select devuelve una colección vacía', async () => {
    service.busquedaPorCoincidenciaParcial.mockResolvedValue([]);

    await request(app.getHttpServer())
      .get('/api/superlinea/select')
      .expect(200, []);
    expect(service.busquedaPorCoincidenciaParcial).toHaveBeenCalledWith('');
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

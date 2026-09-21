import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { ProductoController } from './producto.controller';
import { ProductoService } from '../services/producto.service';

describe('ProductoController search endpoints', () => {
  let app: INestApplication;
  const service = {
    busquedaPorCoincidenciaParcial: jest.fn(),
    findProductosBySuperLinea: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductoController],
      providers: [{ provide: ProductoService, useValue: service }],
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

  it('Devolver los productos cuya denominación contiene el término (paginado de a 10)', async () => {
    service.busquedaPorCoincidenciaParcial.mockResolvedValue({
      data: [{ id: 7, denominacion: 'Harina integral' }],
      total: 1,
    });

    await request(app.getHttpServer())
      .get('/api/producto/search-by-denominacion')
      .query({ denominacion: 'harina', skip: 0, take: 10 })
      .expect(200)
      .expect({ data: [{ id: 7, denominacion: 'Harina integral' }], total: 1 });

    expect(service.busquedaPorCoincidenciaParcial).toHaveBeenCalledWith(
      'harina',
      0,
      10,
    );
  });

  it('El endpoint propaga el término con tilde tal cual lo recibe', async () => {
    service.busquedaPorCoincidenciaParcial.mockResolvedValue({
      data: [],
      total: 0,
    });

    await request(app.getHttpServer())
      .get('/api/producto/search-by-denominacion')
      .query({ denominacion: 'harína', skip: 0, take: 10 })
      .expect(200)
      .expect({ data: [], total: 0 });

    expect(service.busquedaPorCoincidenciaParcial).toHaveBeenCalledWith(
      'harína',
      0,
      10,
    );
  });

  it('Rechazar una paginación inválida (take fuera de rango)', async () => {
    await request(app.getHttpServer())
      .get('/api/producto/search-by-denominacion')
      .query({ denominacion: 'harina', skip: 0, take: 0 })
      .expect(400);

    expect(service.busquedaPorCoincidenciaParcial).not.toHaveBeenCalled();
  });

  it('Traer los productos de la superlínea incluyendo todas sus líneas (paginado de a 10)', async () => {
    service.findProductosBySuperLinea.mockResolvedValue({
      data: [{ id: 2, denominacion: 'Arroz' }],
      total: 1,
    });

    await request(app.getHttpServer())
      .get('/api/producto/search-by-superlinea')
      .query({ superLineaId: 5, skip: 0, take: 10 })
      .expect(200)
      .expect({ data: [{ id: 2, denominacion: 'Arroz' }], total: 1 });

    expect(service.findProductosBySuperLinea).toHaveBeenCalledWith(5, 0, 10);
  });

  it('El identificador de superlínea es obligatorio (400 sin superLineaId)', async () => {
    await request(app.getHttpServer())
      .get('/api/producto/search-by-superlinea')
      .query({ skip: 0, take: 10 })
      .expect(400);

    expect(service.findProductosBySuperLinea).not.toHaveBeenCalled();
  });
});

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

/**
 * Actualización de un producto (HTTP).
 *
 * El contrato PUT exige denominación, costo, porcentaje (margen), stock,
 * stock mínimo, marca, línea y presentación. Las omisiones se rechazan en el
 * límite HTTP antes de llegar al servicio.
 */
describe('actualización de un producto', () => {
  let app: INestApplication;
  const service = { update: jest.fn() };

  const baseDto = {
    denominacion: 'coca-cola gaseosas botella 1 l',
    usuarioUpdatedId: 1,
    costo: 100,
    porcentaje: 20,
    stock: 10,
    stockMinimo: 5,
    marcaId: 1,
    lineaId: 1,
    presentacionId: 1,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    service.update.mockResolvedValue({
      mensaje: 'Producto editada con éxito con denominacion: coca-cola gaseosas botella 1 l',
    });

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

  it.each([
    ['costo', 'costo'],
    ['margen', 'porcentaje'],
    ['stockActual', 'stock'],
    ['stockMínimo', 'stockMinimo'],
    ['marca', 'marcaId'],
    ['línea', 'lineaId'],
    ['presentación', 'presentacionId'],
    ['denominación', 'denominacion'],
  ] as const)(
    'CP - Rechazar una actualización sin %s (el producto conserva sus datos)',
    async (campoDoc, campoDto) => {
      const { [campoDto]: _omitido, ...body } = baseDto;

      await request(app.getHttpServer())
        .put('/api/producto/1')
        .send(body)
        .expect(400);

      expect(service.update).not.toHaveBeenCalled();
    },
  );
});

/**
 * Actualización masiva de precios (HTTP).
 *
 * El endpoint POST /api/producto/actualizar-precios responde 201 en éxito
 * (código por defecto de NestJS para POST; el controlador no declara @HttpCode).
 */
describe('actualización masiva de precios', () => {
  let app: INestApplication;
  const service = { actualizarPrecios: jest.fn() };

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

  it('CP - Rechazar una actualización con monto y porcentaje simultáneamente', async () => {
    await request(app.getHttpServer())
      .post('/api/producto/actualizar-precios')
      .send({
        tipoAjuste: 'MONTO_FIJO',
        operacion: 'AUMENTO',
        valor: 20,
        porcentaje: 10,
      })
      .expect(400);

    expect(service.actualizarPrecios).not.toHaveBeenCalled();
  });

  it('CP - Rechazar una actualización sin monto ni porcentaje', async () => {
    await request(app.getHttpServer())
      .post('/api/producto/actualizar-precios')
      .send({})
      .expect(400);

    expect(service.actualizarPrecios).not.toHaveBeenCalled();
  });

  it('CP - Rechazar un valor de ajuste no positivo', async () => {
    await request(app.getHttpServer())
      .post('/api/producto/actualizar-precios')
      .send({
        tipoAjuste: 'MONTO_FIJO',
        operacion: 'AUMENTO',
        valor: 0,
      })
      .expect(400);

    expect(service.actualizarPrecios).not.toHaveBeenCalled();
  });

  it('CP - Mostrar el resultado de la actualización masiva', async () => {
    const respuesta = {
      message: 'Actualización de precios realizada correctamente.',
      productos: [
        { denominacion: 'coca-cola gaseosas botella 1 l', costo: 90, precio: 108 },
      ],
    };
    service.actualizarPrecios.mockResolvedValue(respuesta);

    await request(app.getHttpServer())
      .post('/api/producto/actualizar-precios')
      .send({
        tipoAjuste: 'PORCENTAJE',
        operacion: 'AUMENTO',
        valor: 10,
      })
      .expect(201, respuesta);

    expect(service.actualizarPrecios).toHaveBeenCalledTimes(1);
  });
});

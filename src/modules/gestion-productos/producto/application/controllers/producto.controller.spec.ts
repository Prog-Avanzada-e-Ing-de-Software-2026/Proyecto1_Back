import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { ProductoController } from './producto.controller';
import { ProductoService } from '../services/producto.service';
import { AlicuotaIva } from 'src/modules/organizacion/enums/alicuota-iva.enum';

describe('ProductoController Presentacion contract', () => {
  let app: INestApplication;
  const service = {
    create: jest.fn(),
    update: jest.fn(),
    findDtoById: jest.fn(),
    findBy: jest.fn(),
    findByIdConAuditoria: jest.fn(),
    remove: jest.fn(),
  };

  const baseCreate = {
    denominacion: 'coca cola 1l',
    utilizaStockMinimo: false,
    utilizaPack: false,
    lineaId: 1,
    marcaId: 2,
    alicuotaIva: AlicuotaIva.ALICUOTA_21,
    precio: 100,
    usuarioCreatedId: 7,
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

  it('requires a non-null integer Presentacion when creating a product', async () => {
    await request(app.getHttpServer())
      .post('/api/producto')
      .send(baseCreate)
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/producto')
      .send({ ...baseCreate, presentacionId: null })
      .expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('accepts an active-parent id when creating', async () => {
    service.create.mockResolvedValue({ mensaje: 'created' });

    await request(app.getHttpServer())
      .post('/api/producto')
      .send({ ...baseCreate, presentacionId: 10 })
      .expect(201, { mensaje: 'created' });
    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ presentacionId: 10 }),
    );
  });

  it('allows omission but rejects null when updating the association', async () => {
    service.update.mockResolvedValue({ mensaje: 'updated' });

    await request(app.getHttpServer())
      .put('/api/producto/1')
      .send({
        denominacion: 'coca cola 1l',
        usuarioUpdatedId: 8,
      })
      .expect(200);
    await request(app.getHttpServer())
      .put('/api/producto/1')
      .send({
        denominacion: 'coca cola 1l',
        usuarioUpdatedId: 8,
        presentacionId: null,
      })
      .expect(400);
    expect(service.update).toHaveBeenCalledTimes(1);
  });
});

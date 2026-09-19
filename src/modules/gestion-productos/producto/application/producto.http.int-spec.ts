/**
 * Tests de integración HTTP end-to-end: aplicación Nest mínima + Supertest
 * contra MySQL 8 real via Testcontainers.
 *
 * Cubre los casos de prueba CP-01, CP-05 y CP-09 de la feature
 * "Historial de precios de un producto".
 *
 * - CP-01: Cambiar el precio de un producto por HTTP (PUT), persistir el
 *          primer cambio de precio en el historial y consultarlo.
 * - CP-05: Paginar el historial de precios (páginas de 10 registros).
 * - CP-09: Consultar el historial de un producto inexistente (404).
 *
 * Los unitarios CP-03, CP-04 y CP-07 viven en producto.entity.spec.ts.
 * Los de integración servicio/repositorio CP-02, CP-06 y CP-08 viven en
 * producto.integracion.int-spec.ts.
 *
 * Requiere Docker corriendo. Sin Docker estos tests fallan (no pasan en silencio).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import type { StartedMySqlContainer } from '@testcontainers/mysql';
import { startMySqlTestContainer } from '../../../../../test/integration/mysql-test-container';
import { App } from 'supertest/types';
import { ProductoController } from './controllers/producto.controller';
import { ProductoService } from './services/producto.service';
import { ProductoPersistenceAdapter } from '../infraestructure/repositories/producto.persistence-adapters';
import { ProductoRepository } from '../infraestructure/repositories/producto.repository';
import { ProductoValidationService } from '../domain/services/producto-validation.service.ts';
import { ProductoRelatedEntitiesValidator } from '../infraestructure/validators/producto-related-entities.validator.ts';
import { ProductoUniquenessValidator } from '../infraestructure/validators/producto-uniqueness.validator.ts';
import { UsuarioValidator } from 'src/modules/common/utils/validation/usuario-validator';
import { ProductoDeletePolicy } from './policies/producto-delete.policy';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { LineaService } from 'src/modules/gestion-productos/linea/application/services/linea.service';
import { MarcaService } from 'src/modules/gestion-productos/marca/application/services/marca.service';
import { ProveedorService } from 'src/modules/organizacion/proveedor/application/services/proveedor.service';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { Producto } from '../domain/entities/producto.entity';
import { CambioPrecio } from '../domain/entities/cambio-precio.entity';
import { MotivoCambioPrecio } from '../enums/motivo-cambio-precio.enum';
import { Linea } from 'src/modules/gestion-productos/linea/domain/entities/linea.entity';
import { SuperLinea } from 'src/modules/gestion-productos/superlinea/domain/entities/superlinea.entity';
import { Marca } from 'src/modules/gestion-productos/marca/domain/entities/marca.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { Init1787269586538 } from 'src/migrations/1787269586538-Init';
import { AddSuperLineaToLinea1789091969000 } from 'src/migrations/1789091969000-AddSuperLineaToLinea';
import { AddCambioPrecioToProducto1789351169000 } from 'src/migrations/1789351169000-AddCambioPrecioToProducto';
import { AddPresentacionToProducto1789200000000 } from 'src/migrations/1789200000000-AddPresentacionToProducto';
import { Presentacion } from 'src/modules/gestion-productos/presentacion/domain/entities/presentacion.entity';
import { Proveedor } from 'src/modules/organizacion/proveedor/domain/entities/proveedor.entity';
import { ProveedorOperacion } from 'src/modules/organizacion/proveedor-operacion/entities/proveedor-operacion.entity';
import { Domicilio } from 'src/modules/gutil/domicilio/entities/domicilio.entity';
import { Localidad } from 'src/modules/gutil/localidad/domain/entities/localidad.entity';
import { Provincia } from 'src/modules/gutil/provincia/domain/entities/provincia.entity';
import { CondicionIva } from 'src/modules/gutil/condicion-iva/domain/entities/condicion-iva.entity';
import { Cliente } from 'src/modules/organizacion/cliente/domain/entities/cliente.entity';
import { ClienteOperacion } from 'src/modules/organizacion/cliente-operacion/entities/cliente-operacion.entity';
import { Personal } from 'src/modules/organizacion/personal/domain/entities/personal.entity';
import { Rol } from 'src/modules/gestion-usuario/rol/domain/entities/rol.entity';
import { ProductoOperacion } from 'src/modules/gestion-productos/producto-operacion/entities/producto-operacion.entity';
import { ProductoIntrinsicValidationService } from '../domain/services/producto-intrinsic-validation.service.ts';

jest.setTimeout(120_000);

const ENTIDADES = [
  Producto,
  CambioPrecio,
  Presentacion,
  Linea,
  SuperLinea,
  Marca,
  Proveedor,
  ProveedorOperacion,
  Domicilio,
  Localidad,
  Provincia,
  CondicionIva,
  Cliente,
  ClienteOperacion,
  Personal,
  Usuario,
  Rol,
  ProductoOperacion,
];

const MIGRATIONS = [
  Init1787269586538,
  AddSuperLineaToLinea1789091969000,
  AddCambioPrecioToProducto1789351169000,
  AddPresentacionToProducto1789200000000,
];

describe('Producto - Historial de precios (HTTP end-to-end)', () => {
  const databaseName = `cr007_http_${process.pid}`;
  let mysql: StartedMySqlContainer;
  let app: INestApplication<App>;
  let dataSource: DataSource;
  const lineaServiceStub = { findEntityById: jest.fn() };
  const marcaServiceStub = { findEntityById: jest.fn() };
  const usuarioServiceStub = { findOne: jest.fn() };
  const presentacionRepositoryStub = { findOne: jest.fn() };

  beforeAll(async () => {
    mysql = await startMySqlTestContainer();

    const admin = new DataSource({
      type: 'mysql',
      host: mysql.getHost(),
      port: mysql.getPort(),
      username: 'root',
      password: mysql.getRootPassword(),
    });
    await admin.initialize();
    await admin.query(`CREATE DATABASE \`${databaseName}\``);
    await admin.destroy();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: mysql.getHost(),
          port: mysql.getPort(),
          username: 'root',
          password: mysql.getRootPassword(),
          database: databaseName,
          entities: ENTIDADES,
          migrations: MIGRATIONS,
          migrationsRun: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([Producto, CambioPrecio]),
      ],
      controllers: [ProductoController],
      providers: [
        ProductoService,
        ProductoPersistenceAdapter,
        { provide: 'IProductoRepository', useClass: ProductoRepository },
        { provide: 'IPresentacionRepository', useValue: presentacionRepositoryStub },
        ProductoIntrinsicValidationService,
        ProductoValidationService,
        ProductoRelatedEntitiesValidator,
        ProductoUniquenessValidator,
        UsuarioValidator,
        ProductoDeletePolicy,
        { provide: 'UnitOfWork', useValue: {} },
        { provide: LineaService, useValue: lineaServiceStub },
        { provide: MarcaService, useValue: marcaServiceStub },
        { provide: ProveedorService, useValue: {} },
        { provide: UsuarioService, useValue: usuarioServiceStub },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    dataSource = moduleFixture.get(DataSource);
  });

  afterAll(async () => {
    if (app) await app.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (mysql) await mysql.stop();
  });

  it('CP-01 - Cambiar el precio, persistir el cambio y consultar el historial', async () => {
    const { linea, marca, usuario, producto } = await crearProducto(
      dataSource,
      'cp01',
    );
    lineaServiceStub.findEntityById.mockResolvedValue(linea);
    marcaServiceStub.findEntityById.mockResolvedValue(marca);
    usuarioServiceStub.findOne.mockResolvedValue(usuario);

    await request(app.getHttpServer())
      .put(`/producto/${producto.id}`)
      .send({
        denominacion: 'coca-cola 1l cp01',
        usuarioUpdatedId: usuario.id,
        precio: 120,
      })
      .expect(200);

    const productoDto = await request(app.getHttpServer())
      .get(`/producto/${producto.id}`)
      .expect(200);
    expect(productoDto.body.precio).toBe(120);

    const historial = await request(app.getHttpServer())
      .get(`/producto/${producto.id}/historial-precios`)
      .query({ skip: 0, take: 10 })
      .expect(200);

    expect(historial.body).toHaveLength(1);
    expect(historial.body[0].precioAnterior).toBe(100);
    expect(historial.body[0].precioNuevo).toBe(120);
    expect(historial.body[0].motivo).toBe(
      MotivoCambioPrecio.ActualizacionDePrecioDirecta,
    );
    expect(new Date(historial.body[0].fecha).getTime()).toBeGreaterThan(0);
  });

  it.each([
    [5, 1, 5],
    [10, 1, 10],
    [11, 1, 10],
    [11, 2, 1],
    [20, 1, 10],
    [20, 2, 10],
  ])(
    'CP-05 - Consultar el historial paginado (cantidad=%s, pagina=%s, resultado=%s)',
    async (cantidad, pagina, resultado) => {
      const { producto, cambios } = await sembrarProductoConHistorial(
        dataSource,
        `cp05-${cantidad}-${pagina}`,
        cantidad,
      );

      const res = await request(app.getHttpServer())
        .get(`/producto/${producto.id}/historial-precios`)
        .query({ skip: (pagina - 1) * 10, take: 10 })
        .expect(200);

      const esperados = cambios
        .slice()
        .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
        .map((cambio) => Number(cambio.precioNuevo));
      const paginaEsperada = esperados.slice(
        (pagina - 1) * 10,
        (pagina - 1) * 10 + resultado,
      );

      expect(res.body).toHaveLength(resultado);
      expect(res.body.map((cambio: any) => cambio.precioNuevo)).toEqual(
        paginaEsperada,
      );
    },
  );

  it('CP-09 - Consultar el historial de un producto inexistente', async () => {
    const res = await request(app.getHttpServer())
      .get('/producto/999999/historial-precios')
      .query({ skip: 0, take: 10 })
      .expect(404);

    expect(res.body.message).toContain('no existe');
  });

  async function crearProducto(ds: DataSource, sufijo: string) {
    const superLineaRepo = ds.getRepository(SuperLinea);
    const lineaRepo = ds.getRepository(Linea);
    const marcaRepo = ds.getRepository(Marca);
    const usuarioRepo = ds.getRepository(Usuario);
    const productoRepo = ds.getRepository(Producto);
    const presentacionRepo = ds.getRepository(Presentacion);

    const superLinea = await superLineaRepo.save(
      superLineaRepo.create({ denominacion: `SL-${sufijo}` }),
    );
    const linea = await lineaRepo.save(
      lineaRepo.create({
        denominacion: `L-${sufijo}`,
        superLinea,
        superLineaId: superLinea.id,
      }),
    );
    const marca = await marcaRepo.save(
      marcaRepo.create({ denominacion: `M-${sufijo}` }),
    );
    const usuario = await usuarioRepo.save(
      usuarioRepo.create({
        mail: `usuario.${sufijo}@test.com`,
        contrasena: 'contrasena123',
        denominacion: `U-${sufijo}`,
      }),
    );
    // The AddPresentacionToProducto migration makes presentacion_id NOT NULL,
    // so every product fixture needs a real presentation row.
    const presentacion = await presentacionRepo.save(
      presentacionRepo.create({ denominacion: `P-${sufijo}` }),
    );
    const producto = await productoRepo.save(
      productoRepo.create({
        denominacion: `coca-cola 1l ${sufijo}`,
        precio: 100,
        linea,
        lineaId: linea.id,
        marca,
        marcaId: marca.id,
        presentacion,
        presentacionId: presentacion.id,
        usuarioCreated: usuario,
      }),
    );

    return { superLinea, linea, marca, usuario, presentacion, producto };
  }

  async function sembrarProductoConHistorial(
    ds: DataSource,
    sufijo: string,
    cantidad: number,
  ) {
    const { producto } = await crearProducto(ds, sufijo);
    const cambioRepo = ds.getRepository(CambioPrecio);
    const cambios: CambioPrecio[] = [];
    const base = Date.now();

    for (let i = 1; i <= cantidad; i++) {
      const cambio = await cambioRepo.save(
        cambioRepo.create({
          producto,
          precioAnterior: 100 + i - 1,
          precioNuevo: 100 + i,
          motivo: MotivoCambioPrecio.ActualizacionDePrecioDirecta,
          fecha: new Date(base + i * 1000),
        }),
      );
      cambios.push(cambio);
    }

    return { producto, cambios };
  }
});
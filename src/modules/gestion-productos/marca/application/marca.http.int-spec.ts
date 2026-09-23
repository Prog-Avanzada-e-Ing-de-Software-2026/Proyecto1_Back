/**
 * Tests de integración HTTP end-to-end: aplicación Nest mínima + Supertest
 * contra MySQL 8 real via Testcontainers.
 *
 * Cubre los casos de prueba CP-10, CP-12, CP-13, CP-14, CP-15 y CP-17 de la
 * feature "Gestión de marca".
 *
 * - CP-10: Crear una marca por HTTP (POST) y consultarla.
 * - CP-12: Rechazar una denominación de más de 255 caracteres (400).
 * - CP-13: Buscar todas las marcas.
 * - CP-14: Consultar una marca por ID.
 * - CP-15: Actualizar la denominación de una marca (PUT).
 * - CP-17: Eliminar una marca cuyos productos asociados están todos
 *          inactivos (sin blindaje de la política de eliminación).
 *
 * El unitario CP-16 vive en politica-eliminacion-marca.service.spec.ts.
 * Los de integración servicio/repositorio CP-11 y CP-16 viven en
 * marca.integracion.int-spec.ts.
 *
 * Collaboradores reales en toda la cadena (sin mocks): MarcaService,
 * UsuarioService, RolService, sus adapters/persistencias y la política de
 * eliminación sobre el repositorio real de Productos.
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
import { MarcaController } from './controllers/marca.controller';
import { MarcaService } from './services/marca.service';
import { MarcaPersistenceAdapter } from '../infraestructure/repositories/marca.persistence-adapters';
import { MarcaRepository } from '../infraestructure/repositories/marca.repository';
import { PoliticaEliminacionMarca } from '../domain/services/politica-eliminacion-marca.service';
import { Marca } from '../domain/entities/marca.entity';
import { Producto } from '../../producto/domain/entities/producto.entity';
import { CambioPrecio } from '../../producto/domain/entities/cambio-precio.entity';
import { ProductoPersistenceAdapter } from '../../producto/infraestructure/repositories/producto.persistence-adapters';
import { ProductoRepository } from '../../producto/infraestructure/repositories/producto.repository';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { UsuarioRepository } from 'src/modules/gestion-usuario/usuario/infraestructure/repositories/usuario-repository';
import { UsuarioPersistenceAdapter } from 'src/modules/gestion-usuario/usuario/infraestructure/repositories/usuario-persistence-adapters';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { RolService } from 'src/modules/gestion-usuario/rol/application/services/rol.service';
import { RolRepository } from 'src/modules/gestion-usuario/rol/infraestructure/repositories/rol-repository';
import { RolPersistenceAdapter } from 'src/modules/gestion-usuario/rol/infraestructure/repositories/rol-persistence-adapters';
import { Rol } from 'src/modules/gestion-usuario/rol/domain/entities/rol.entity';
import { NormalizeDenominacionPipe } from 'src/modules/common/pipes/normalize-denominations.pipe';
import { NormalizeDenominacionSearchPipe } from 'src/modules/common/pipes/normalize-denominations-search.pipe';
import { Init1787269586538 } from 'src/migrations/1787269586538-Init';
import { AddSuperLineaToLinea1789091969000 } from 'src/migrations/1789091969000-AddSuperLineaToLinea';
import { AddCambioPrecioToProducto1789351169000 } from 'src/migrations/1789351169000-AddCambioPrecioToProducto';
import { AddPresentacionToProducto1789200000000 } from 'src/migrations/1789200000000-AddPresentacionToProducto';
import { RemoveSuperLineaDenominacionUnique1789400000000 } from 'src/migrations/1789400000000-RemoveSuperLineaDenominacionUnique';
import { Presentacion } from 'src/modules/gestion-productos/presentacion/domain/entities/presentacion.entity';
import { Linea } from 'src/modules/gestion-productos/linea/domain/entities/linea.entity';
import { SuperLinea } from 'src/modules/gestion-productos/superlinea/domain/entities/superlinea.entity';
import { Proveedor } from 'src/modules/organizacion/proveedor/domain/entities/proveedor.entity';
import { ProveedorOperacion } from 'src/modules/organizacion/proveedor-operacion/entities/proveedor-operacion.entity';
import { Domicilio } from 'src/modules/gutil/domicilio/entities/domicilio.entity';
import { Localidad } from 'src/modules/gutil/localidad/domain/entities/localidad.entity';
import { Provincia } from 'src/modules/gutil/provincia/domain/entities/provincia.entity';
import { CondicionIva } from 'src/modules/gutil/condicion-iva/domain/entities/condicion-iva.entity';
import { Cliente } from 'src/modules/organizacion/cliente/domain/entities/cliente.entity';
import { ClienteOperacion } from 'src/modules/organizacion/cliente-operacion/entities/cliente-operacion.entity';
import { Personal } from 'src/modules/organizacion/personal/domain/entities/personal.entity';
import { ProductoOperacion } from 'src/modules/gestion-productos/producto-operacion/entities/producto-operacion.entity';

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
  RemoveSuperLineaDenominacionUnique1789400000000,
];

describe('Marca - Gestión de marca (HTTP end-to-end)', () => {
  const databaseName = `cr007_marca_http_${process.pid}`;
  let mysql: StartedMySqlContainer;
  let app: INestApplication<App>;
  let dataSource: DataSource;

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
        TypeOrmModule.forFeature([Marca, Producto, CambioPrecio, Usuario, Rol]),
      ],
      controllers: [MarcaController],
      providers: [
        MarcaService,
        MarcaPersistenceAdapter,
        { provide: 'IMarcaRepository', useClass: MarcaRepository },
        PoliticaEliminacionMarca,
        ProductoPersistenceAdapter,
        { provide: 'IProductoRepository', useClass: ProductoRepository },
        UsuarioService,
        UsuarioPersistenceAdapter,
        { provide: 'IUsuarioRepository', useClass: UsuarioRepository },
        RolService,
        RolPersistenceAdapter,
        { provide: 'IRolRepository', useClass: RolRepository },
        NormalizeDenominacionPipe,
        NormalizeDenominacionSearchPipe,
        { provide: 'UnitOfWork', useValue: {} },
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

  it('Crear una marca por HTTP y consultarla', async () => {
    const usuario = await sembrarUsuario(dataSource, 'cp10');

    const res = await request(app.getHttpServer())
      .post('/marca')
      .send({ denominacion: 'Pepsi', usuarioCreatedId: usuario.id })
      .expect(201);

    expect(res.body.mensaje).toMatch(/Marca creada/);

    const busqueda = await request(app.getHttpServer())
      .get('/marca/search-by')
      .query({ skip: 0, take: 10 })
      .expect(200);

    const pepsi = busqueda.body.data.find(
      (marca: any) => marca.denominacion.toUpperCase() === 'PEPSI',
    );
    expect(pepsi).toBeDefined();
  });

  it('Rechazar una denominación de más de 255 caracteres', async () => {
    await request(app.getHttpServer())
      .post('/marca')
      .send({ denominacion: 'P'.repeat(256), usuarioCreatedId: 1 })
      .expect(400);

    const busqueda = await request(app.getHttpServer())
      .get('/marca/search-by')
      .query({ denominacion: 'P'.repeat(100), skip: 0, take: 10 })
      .expect(200);

    expect(busqueda.body.data).toEqual([]);
  });

  it('Buscar todas las marcas', async () => {
    await sembrarMarcas(dataSource, ['Coca-Cola', 'Coca-Cola Zero', 'Pepsi']);

    const res = await request(app.getHttpServer())
      .get('/marca/search-by')
      .query({ skip: 0, take: 10 })
      .expect(200);

    const denominaciones = res.body.data.map((marca: any) => marca.denominacion);
    expect(denominaciones).toEqual(
      expect.arrayContaining(['Coca-Cola', 'Coca-Cola Zero', 'Pepsi']),
    );
  });

  it('Consultar una marca por ID', async () => {
    const { marca } = await sembrarMarca(dataSource, 'cp14');

    const res = await request(app.getHttpServer())
      .get(`/marca/${marca.id}`)
      .expect(200);

    expect(res.body.id).toBe(marca.id);
    expect(res.body.denominacion).toBe('M-cp14');
  });

  it('Actualizar la denominación de una marca', async () => {
    const { marca, usuario } = await sembrarMarcaConUsuario(
      dataSource,
      'cp15',
    );

    await request(app.getHttpServer())
      .put(`/marca/${marca.id}`)
      .send({ denominacion: 'coca cola company', usuarioUpdatedId: usuario.id })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/marca/${marca.id}`)
      .expect(200);

    expect(res.body.denominacion.toUpperCase()).toBe('COCA COLA COMPANY');
  });

  it('Eliminar una marca con todos sus productos inactivos', async () => {
    const { marca, usuario } = await sembrarMarcaConProducto(
      dataSource,
      'cp17',
      true,
    );

    const res = await request(app.getHttpServer())
      .delete(`/marca/${marca.id}`)
      .query({ usuarioId: usuario.id })
      .expect(200);

    expect(res.body.mensaje).toMatch(/Marca eliminada/);

    const consulta = await request(app.getHttpServer())
      .get(`/marca/${marca.id}`)
      .expect(404);
    expect(consulta.body.message).toContain('no existe');

    const busqueda = await request(app.getHttpServer())
      .get('/marca/search-by')
      .query({ denominacion: 'cp17', skip: 0, take: 10 })
      .expect(200);

    expect(busqueda.body.data).toHaveLength(0);
  });

  async function sembrarUsuario(ds: DataSource, sufijo: string) {
    const usuarioRepo = ds.getRepository(Usuario);
    return usuarioRepo.save(
      usuarioRepo.create({
        mail: `usuario.${sufijo}@test.com`,
        contrasena: 'contrasena123',
        denominacion: `U-${sufijo}`,
      }),
    );
  }

  async function sembrarMarcas(ds: DataSource, denominaciones: string[]) {
    const marcaRepo = ds.getRepository(Marca);
    for (const denominacion of denominaciones) {
      await marcaRepo.save(marcaRepo.create({ denominacion }));
    }
  }

  async function sembrarMarca(ds: DataSource, sufijo: string) {
    const marcaRepo = ds.getRepository(Marca);
    const marca = await marcaRepo.save(
      marcaRepo.create({ denominacion: `M-${sufijo}` }),
    );
    return { marca };
  }

  async function sembrarMarcaConUsuario(ds: DataSource, sufijo: string) {
    const marcaRepo = ds.getRepository(Marca);
    const usuarioRepo = ds.getRepository(Usuario);

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

    return { marca, usuario };
  }

  async function sembrarMarcaConProducto(
    ds: DataSource,
    sufijo: string,
    inactivo: boolean,
  ) {
    const marcaRepo = ds.getRepository(Marca);
    const usuarioRepo = ds.getRepository(Usuario);
    const productoRepo = ds.getRepository(Producto);
    const presentacionRepo = ds.getRepository(Presentacion);

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
        marca,
        marcaId: marca.id,
        presentacion,
        presentacionId: presentacion.id,
        usuarioCreated: usuario,
        ...(inactivo ? { deletedAt: new Date() } : {}),
      }),
    );

    return { marca, usuario, producto };
  }
});
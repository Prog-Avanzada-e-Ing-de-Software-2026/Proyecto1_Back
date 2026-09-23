/**
 * Contrato HTTP de la búsqueda general de productos con persistencia real:
 * CP-97 (mitad de endpoint) y CP-98.
 *
 * A diferencia de `producto.controller.spec.ts`, acá el `IProductoRepository`
 * NO está mockeado: se usa el `ProductoRepository` real, que delega en el
 * `ProductoPersistenceAdapter` real contra un MySQL 8 levantado con
 * Testcontainers. El filtro global de excepciones también es el real
 * (`GlobalExceptionFilter`, el mismo de `main.ts`), porque lo observable de
 * CP-98 vive ahí.
 *
 * - CP-97: `/api/producto/search-by` recibe `codReferenciaExacto`, pero el
 *   controller no lo desestructura (`producto.controller.ts:116-127`) y el
 *   adaptador siempre busca el código de referencia de forma parcial. La
 *   aserción exige el comportamiento prometido por el contrato: en modo exacto
 *   solo el código "1234", no "12345". Se espera en rojo.
 * - CP-98: `findBy` no envuelve los errores de base en `try/catch`, así que
 *   ante una base que no responde el error crudo llega al cliente a través del
 *   filtro global. Se espera en rojo.
 *
 * Requiere Docker corriendo.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import type { StartedMySqlContainer } from '@testcontainers/mysql';
import { startMySqlTestContainer } from '../../../../../../test/integration/mysql-test-container';
import { App } from 'supertest/types';

import { ProductoController } from './producto.controller';
import { ProductoService } from '../services/producto.service';
import { ProductoPersistenceAdapter } from '../../infraestructure/repositories/producto.persistence-adapters';
import { ProductoRepository } from '../../infraestructure/repositories/producto.repository';
import { ProductoIntrinsicValidationService } from '../../domain/services/producto-intrinsic-validation.service.ts';
import { ProductoValidationService } from '../../domain/services/producto-validation.service.ts';
import { ProductoRelatedEntitiesValidator } from '../../infraestructure/validators/producto-related-entities.validator.ts';
import { ProductoUniquenessValidator } from '../../infraestructure/validators/producto-uniqueness.validator.ts';
import { ProductoDeletePolicy } from '../policies/producto-delete.policy';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { UsuarioValidator } from 'src/modules/common/utils/validation/usuario-validator';
import { GlobalExceptionFilter } from 'src/modules/common/filters/global-exception.filters';
import { LineaService } from 'src/modules/gestion-productos/linea/application/services/linea.service';
import { MarcaService } from 'src/modules/gestion-productos/marca/application/services/marca.service';
import { ProveedorService } from 'src/modules/organizacion/proveedor/application/services/proveedor.service';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';

import { Producto } from '../../domain/entities/producto.entity';
import { CambioPrecio } from '../../domain/entities/cambio-precio.entity';
import { Presentacion } from 'src/modules/gestion-productos/presentacion/domain/entities/presentacion.entity';
import { Linea } from 'src/modules/gestion-productos/linea/domain/entities/linea.entity';
import { SuperLinea } from 'src/modules/gestion-productos/superlinea/domain/entities/superlinea.entity';
import { Marca } from 'src/modules/gestion-productos/marca/domain/entities/marca.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
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

import { Init1787269586538 } from 'src/migrations/1787269586538-Init';
import { AddSuperLineaToLinea1789091969000 } from 'src/migrations/1789091969000-AddSuperLineaToLinea';
import { AddPresentacionToProducto1789200000000 } from 'src/migrations/1789200000000-AddPresentacionToProducto';
import { RemoveSuperLineaDenominacionUnique1789400000000 } from 'src/migrations/1789400000000-RemoveSuperLineaDenominacionUnique';
import { AddCambioPrecioToProducto1789351169000 } from 'src/migrations/1789351169000-AddCambioPrecioToProducto';

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
  AddPresentacionToProducto1789200000000,
  AddCambioPrecioToProducto1789351169000,
  RemoveSuperLineaDenominacionUnique1789400000000,
];

describe('Producto - Búsqueda general (HTTP con MySQL real)', () => {
  const databaseName = `busqueda_general_http_${process.pid}`;
  let mysql: StartedMySqlContainer;
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let presentacionId: number;
  let baseDeDatosDetenida = false;

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
        ProductoIntrinsicValidationService,
        ProductoValidationService,
        ProductoRelatedEntitiesValidator,
        ProductoUniquenessValidator,
        UsuarioValidator,
        ProductoDeletePolicy,
        { provide: 'UnitOfWork', useValue: {} },
        { provide: 'IPresentacionRepository', useValue: {} },
        { provide: LineaService, useValue: {} },
        { provide: MarcaService, useValue: {} },
        { provide: ProveedorService, useValue: {} },
        { provide: UsuarioService, useValue: {} },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    // El mismo filtro que registra `main.ts` (`main.ts:39`).
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    dataSource = moduleFixture.get(DataSource);

    const result = await dataSource.query(
      'INSERT INTO `presentacion` (`denominacion`) VALUES (?)',
      ['Presentacion busqueda general HTTP'],
    );
    presentacionId = result.insertId as number;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (mysql && !baseDeDatosDetenida) await mysql.stop();
  });

  async function seedProducto(fixture: {
    denominacion: string;
    codigoReferencia?: string | null;
  }): Promise<void> {
    await dataSource.query(
      'INSERT INTO `producto` (`denominacion`, `presentacion_id`, `codigoReferencia`) VALUES (?, ?, ?)',
      [
        fixture.denominacion,
        presentacionId,
        fixture.codigoReferencia ?? null,
      ],
    );
  }

  it('El modo exacto de búsqueda por código de referencia debe respetarse en search-by', async () => {
    // Given existe un producto con código de referencia "1234"...
    await seedProducto({
      denominacion: 'Producto codigo corto',
      codigoReferencia: '1234',
    });
    // ...y existe un producto con código de referencia "12345".
    await seedProducto({
      denominacion: 'Producto codigo largo',
      codigoReferencia: '12345',
    });

    // When se busca por código de referencia en modo exacto con "1234".
    const res = await request(app.getHttpServer())
      .get('/api/producto/search-by')
      .query({
        codigoReferencia: '1234',
        codReferenciaExacto: 'true',
        skip: 0,
        take: 10,
      })
      .expect(200);

    // Then se devuelve solo el producto con código "1234"...
    const codigos = res.body.data.map(
      (producto: { codigoReferencia: string }) => producto.codigoReferencia,
    );
    expect(codigos).toEqual(['1234']);
    expect(res.body.total).toBe(1);
    // ...y no se devuelve el producto con código "12345".
    expect(codigos).not.toContain('12345');
  });

  it('Informar un error controlado cuando la base de datos no responde', async () => {
    // Given la base de datos no está disponible.
    await mysql.stop();
    baseDeDatosDetenida = true;

    // When se realiza la búsqueda general con un filtro válido.
    const res = await request(app.getHttpServer())
      .get('/api/producto/search-by')
      .query({ denominacion: 'agua', skip: 0, take: 10 });

    // Then la respuesta debe tener código HTTP 500.
    expect(res.status).toBe(500);
    // And el mensaje debe ser un mensaje controlado de la aplicación.
    expect(res.body.message).toBe('Error inesperado en la base de datos.');
    // And el mensaje no debe exponer el error crudo del motor de base de datos.
    // El fallo de conexión real de mysql2 es, por ejemplo,
    // "Connection lost: The server closed the connection." con código
    // PROTOCOL_CONNECTION_LOST; ninguno de esos textos debe llegar al cliente.
    expect(res.body.message).not.toMatch(
      /ECONNREFUSED|ECONNRESET|PROTOCOL_CONNECTION_LOST|ETIMEDOUT|ENOTFOUND|Connection lost|server closed the connection|mysql|SELECT|FROM|producto/i,
    );
  });
});

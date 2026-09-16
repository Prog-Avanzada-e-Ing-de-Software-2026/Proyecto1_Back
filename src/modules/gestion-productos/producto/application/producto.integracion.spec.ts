/**
 * Tests de integración: ProductService + ProductoRepository +
 * ProductoPersistenceAdapter contra MySQL 8 real via Testcontainers.
 *
 * Cubre los casos de prueba CP-02, CP-06 y CP-08 de la feature
 * "Historial de precios de un producto".
 *
 * - CP-02: Mantener la continuidad del historial entre cambios sucesivos.
 * - CP-06: Consultar el historial de un producto sin cambios de precio.
 * - CP-08: Actualizar un producto sin enviar precio / con precio igual al actual.
 *
 * Los unitarios CP-03, CP-04 y CP-07 viven en producto.entity.spec.ts.
 * Los HTTP end-to-end CP-01, CP-05 y CP-09 viven en producto.http.spec.ts.
 *
 * Requiere Docker corriendo. Sin Docker estos tests fallan (no pasan en silencio).
 */
import { DataSource } from 'typeorm';
import {
  MySqlContainer,
  StartedMySqlContainer,
} from '@testcontainers/mysql';
import { Producto } from '../domain/entities/producto.entity';
import { CambioPrecio } from '../domain/entities/cambio-precio.entity';
import { MotivoCambioPrecio } from '../enums/motivo-cambio-precio.enum';
import { ProductoPersistenceAdapter } from '../infraestructure/repositories/producto.persistence-adapters';
import { ProductoRepository } from '../infraestructure/repositories/producto.repository';
import { ProductoService } from './services/producto.service';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { Linea } from 'src/modules/gestion-productos/linea/domain/entities/linea.entity';
import { SuperLinea } from 'src/modules/gestion-productos/superlinea/domain/entities/superlinea.entity';
import { Marca } from 'src/modules/gestion-productos/marca/domain/entities/marca.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { Init1787269586538 } from 'src/migrations/1787269586538-Init';
import { AddSuperLineaToLinea1789091969000 } from 'src/migrations/1789091969000-AddSuperLineaToLinea';
import { AddCambioPrecioToProducto1789351169000 } from 'src/migrations/1789351169000-AddCambioPrecioToProducto';
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

jest.setTimeout(120_000);

const ENTIDADES = [
  Producto,
  CambioPrecio,
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
];

describe('Producto - Historial de precios (integración servicio/repositorio + MySQL real)', () => {
  const databaseName = `cr007_integration_${process.pid}`;
  let mysql: StartedMySqlContainer;
  let dataSource: DataSource;
  let repository: ProductoRepository;
  let service: ProductoService;

  beforeAll(async () => {
    mysql = await new MySqlContainer('mysql:8.0').start();

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

    dataSource = new DataSource({
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
    });
    await dataSource.initialize();

    const productoRepo = dataSource.getRepository(Producto);
    const cambioPrecioRepo = dataSource.getRepository(CambioPrecio);
    const adapter = new ProductoPersistenceAdapter(
      productoRepo,
      cambioPrecioRepo,
      dataSource,
      {} as IUnitOfWork,
    );
    repository = new ProductoRepository(adapter);

    service = new ProductoService(
      repository,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (mysql) await mysql.stop();
  });

  it('CP-02 - Mantener la continuidad del historial entre cambios sucesivos', async () => {
    const { producto, linea, marca, usuario } = await crearProducto(dataSource, 'cp02');

    await repository.update(producto.id, { precio: 120 } as any, linea, marca, usuario);
    await repository.update(producto.id, { precio: 150 } as any, linea, marca, usuario);

    const historial = await service.getHistorialPrecios(producto.id, { skip: 0, take: 10 });

    expect(historial).toHaveLength(2);
    expect(historial[0].precioAnterior).toBe(120);
    expect(historial[0].precioNuevo).toBe(150);
    expect(historial[0].motivo).toBe(MotivoCambioPrecio.ActualizacionDePrecioDirecta);
    expect(historial[1].precioAnterior).toBe(100);
    expect(historial[1].precioNuevo).toBe(120);
    expect(historial[1].motivo).toBe(MotivoCambioPrecio.ActualizacionDePrecioDirecta);
  });

  it('CP-06 - Consultar el historial de un producto sin cambios de precio', async () => {
    const { producto } = await crearProducto(dataSource, 'cp06');

    const historial = await service.getHistorialPrecios(producto.id, { skip: 0, take: 10 });

    expect(historial).toEqual([]);
  });

  it('CP-08a - Actualizar un producto con precio igual al actual', async () => {
    const { producto, linea, marca, usuario } = await crearProducto(dataSource, 'cp08a');

    await repository.update(producto.id, { precio: 100 } as any, linea, marca, usuario);

    const actualizado = await repository.findOne(producto.id);
    expect(actualizado?.precio).toBe(100);

    const historial = await service.getHistorialPrecios(producto.id, { skip: 0, take: 10 });
    expect(historial).toEqual([]);
  });

  it('CP-08b - Actualizar un producto sin enviar el campo precio', async () => {
    const { producto, linea, marca, usuario } = await crearProducto(dataSource, 'cp08b');

    await repository.update(producto.id, {} as any, linea, marca, usuario);

    const actualizado = await repository.findOne(producto.id);
    expect(actualizado?.precio).toBe(100);

    const historial = await service.getHistorialPrecios(producto.id, { skip: 0, take: 10 });
    expect(historial).toEqual([]);
  });

  async function crearProducto(ds: DataSource, sufijo: string) {
    const superLineaRepo = ds.getRepository(SuperLinea);
    const lineaRepo = ds.getRepository(Linea);
    const marcaRepo = ds.getRepository(Marca);
    const usuarioRepo = ds.getRepository(Usuario);
    const productoRepo = ds.getRepository(Producto);

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
    const producto = await productoRepo.save(
      productoRepo.create({
        denominacion: `coca-cola 1l ${sufijo}`,
        precio: 100,
        linea,
        lineaId: linea.id,
        marca,
        marcaId: marca.id,
        usuarioCreated: usuario,
      }),
    );

    return { superLinea, linea, marca, usuario, producto };
  }
});
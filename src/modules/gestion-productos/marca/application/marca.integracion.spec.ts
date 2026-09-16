/**
 * Tests de integración: MarcaService + MarcaRepository +
 * MarcaPersistenceAdapter (con cadena real de Usuario/Rol y la política de
 * eliminación sobre el repositorio de Productos) contra MySQL 8 real via
 * Testcontainers.
 *
 * Cubre los casos de prueba CP-11 y CP-16 de la feature "Gestión de marca".
 *
 * - CP-11: Rechazar la creación de una marca con denominación duplicada.
 * - CP-16: Rechazar la eliminación de una marca con productos activos
 *          (ConflictException) y dejar la marca intacta.
 *
 * El unitario CP-16 vive en politica-eliminacion-marca.service.spec.ts.
 * Los HTTP end-to-end CP-10, CP-12, CP-13, CP-14, CP-15 y CP-17 viven en
 * marca.http.spec.ts.
 *
 * Requiere Docker corriendo. Sin Docker estos tests fallan (no pasan en silencio).
 */
import { DataSource } from 'typeorm';
import {
  MySqlContainer,
  StartedMySqlContainer,
} from '@testcontainers/mysql';
import { Producto } from '../../producto/domain/entities/producto.entity';
import { CambioPrecio } from '../../producto/domain/entities/cambio-precio.entity';
import { ProductoPersistenceAdapter } from '../../producto/infraestructure/repositories/producto.persistence-adapters';
import { ProductoRepository } from '../../producto/infraestructure/repositories/producto.repository';
import { MarcaPersistenceAdapter } from '../infraestructure/repositories/marca.persistence-adapters';
import { MarcaRepository } from '../infraestructure/repositories/marca.repository';
import { MarcaService } from './services/marca.service';
import { PoliticaEliminacionMarca } from '../domain/services/politica-eliminacion-marca.service';
import { Marca } from '../domain/entities/marca.entity';
import { CreateMarcaDto } from '../dto/create-marca.dto';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { UsuarioRepository } from 'src/modules/gestion-usuario/usuario/infraestructure/repositories/usuario-repository';
import { UsuarioPersistenceAdapter } from 'src/modules/gestion-usuario/usuario/infraestructure/repositories/usuario-persistence-adapters';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { RolService } from 'src/modules/gestion-usuario/rol/application/services/rol.service';
import { RolRepository } from 'src/modules/gestion-usuario/rol/infraestructure/repositories/rol-repository';
import { RolPersistenceAdapter } from 'src/modules/gestion-usuario/rol/infraestructure/repositories/rol-persistence-adapters';
import { Rol } from 'src/modules/gestion-usuario/rol/domain/entities/rol.entity';
import { Init1787269586538 } from 'src/migrations/1787269586538-Init';
import { AddSuperLineaToLinea1789091969000 } from 'src/migrations/1789091969000-AddSuperLineaToLinea';
import { AddCambioPrecioToProducto1789351169000 } from 'src/migrations/1789351169000-AddCambioPrecioToProducto';
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

describe('Marca - Gestión de marca (integración servicio/repositorio + MySQL real)', () => {
  const databaseName = `cr007_marca_integration_${process.pid}`;
  let mysql: StartedMySqlContainer;
  let dataSource: DataSource;
  let service: MarcaService;

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
    const productoAdapter = new ProductoPersistenceAdapter(
      productoRepo,
      cambioPrecioRepo,
      dataSource,
      {} as IUnitOfWork,
    );
    const productoRepository = new ProductoRepository(productoAdapter);

    const marcaRepo = dataSource.getRepository(Marca);
    const marcaAdapter = new MarcaPersistenceAdapter(
      marcaRepo,
      dataSource,
      {} as IUnitOfWork,
    );
    const marcaRepository = new MarcaRepository(marcaAdapter);

    const rolRepo = dataSource.getRepository(Rol);
    const rolAdapter = new RolPersistenceAdapter(rolRepo, dataSource);
    const rolRepository = new RolRepository(rolAdapter);
    const rolService = new RolService(rolRepository);

    const usuarioRepo = dataSource.getRepository(Usuario);
    const usuarioAdapter = new UsuarioPersistenceAdapter(usuarioRepo, dataSource);
    const usuarioRepository = new UsuarioRepository(usuarioAdapter);
    const usuarioService = new UsuarioService(usuarioRepository, rolService);

    const politica = new PoliticaEliminacionMarca(productoRepository);
    service = new MarcaService(marcaRepository, usuarioService, politica);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (mysql) await mysql.stop();
  });

  it('CP-11 - Rechazar la creación de una marca con denominación duplicada', async () => {
    const dto = {
      denominacion: 'Pepsi',
      usuarioCreatedId: 1,
    } as CreateMarcaDto;

    await expect(service.create(dto)).resolves.toBeDefined();

    await expect(service.create(dto)).rejects.toThrow('Denominación ya en uso.');

    const resultado = await service.findBy('', 0, 10);
    expect(resultado.data).toHaveLength(1);
    expect(resultado.data[0].denominacion).toBe('Pepsi');
  });

  it('CP-16 - Rechazar la eliminación de una marca con productos activos', async () => {
    const { marca, usuario } = await sembrarMarcaConProductoActivo(
      dataSource,
      'cp16',
    );

    await expect(service.remove(marca.id, usuario.id)).rejects.toThrow(
      'No se puede eliminar la marca porque está asociada a productos activos.',
    );

    await expect(service.findEntityById(marca.id)).resolves.toBeDefined();

    const resultado = await service.findBy('cp16', 0, 10);
    expect(resultado.data).toHaveLength(1);
    expect(resultado.data[0].denominacion).toBe('M-cp16');
  });

  async function sembrarMarcaConProductoActivo(ds: DataSource, sufijo: string) {
    const marcaRepo = ds.getRepository(Marca);
    const usuarioRepo = ds.getRepository(Usuario);
    const productoRepo = ds.getRepository(Producto);

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
        marca,
        marcaId: marca.id,
        usuarioCreated: usuario,
      }),
    );

    return { marca, usuario, producto };
  }
});
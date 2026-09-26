/**
 * Tests de integración del flujo de REGISTRO de producto contra MySQL 8 real
 * via Testcontainers: CP-18, CP-22, CP-23 y CP-25.
 *
 * Cubre los casos de la feature "Gestión de productos" que requieren persistencia:
 * - CP - Registrar un producto con todos sus datos válidos.
 * - CP - Rechazar una denominación duplicada al registrar.
 * - CP - Validar el límite de 200 caracteres de la denominación.
 * - CP - Rechazar el registro con una presentación que no está activa (soft-deleted).
 *
 * Requiere Docker y @testcontainers/mysql. Si la infraestructura de contenedores
 * no está disponible, estos specs fallan explícitamente.
 */
import { DataSource } from 'typeorm';
import type { StartedMySqlContainer } from '@testcontainers/mysql';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { startMySqlTestContainer } from '../../../../../test/integration/mysql-test-container';
import { Producto } from '../domain/entities/producto.entity';
import { CambioPrecio } from '../domain/entities/cambio-precio.entity';
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
import { AddPresentacionToProducto1789200000000 } from 'src/migrations/1789200000000-AddPresentacionToProducto';
import { Presentacion } from 'src/modules/gestion-productos/presentacion/domain/entities/presentacion.entity';
import { PresentacionPersistenceAdapter } from 'src/modules/gestion-productos/presentacion/infraestructure/repositories/presentacion.persistence-adapter';
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
import { ProductoValidationService } from '../domain/services/producto-validation.service.ts';
import { ProductoUniquenessValidator } from '../infraestructure/validators/producto-uniqueness.validator.ts';

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

interface BaseSembrada {
  superLinea: SuperLinea;
  linea: Linea;
  marca: Marca;
  usuario: Usuario;
  presentacion: Presentacion;
}

describe('Producto - registro (integración servicio/repositorio + MySQL real)', () => {
  const databaseName = `producto_registro_integration_${process.pid}`;
  let mysql: StartedMySqlContainer;
  let dataSource: DataSource;
  let productoRepo: any;
  let repository: ProductoRepository;
  let service: ProductoService;
  let presentacionAdapter: PresentacionPersistenceAdapter;
  let relatedEntitiesValidator: { validarYObtenerEntidadesRelacionadas: jest.Mock };
  let usuarioValidator: { validarUsuarioExiste: jest.Mock };
  let usuarioService: { findOne: jest.Mock };

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

    productoRepo = dataSource.getRepository(Producto);
    const cambioPrecioRepo = dataSource.getRepository(CambioPrecio);
    const presentacionRepo = dataSource.getRepository(Presentacion);
    const adapter = new ProductoPersistenceAdapter(
      productoRepo,
      cambioPrecioRepo,
      dataSource,
      {} as IUnitOfWork,
    );
    repository = new ProductoRepository(adapter);
    presentacionAdapter = new PresentacionPersistenceAdapter(
      presentacionRepo,
      dataSource,
      {} as IUnitOfWork,
    );

    relatedEntitiesValidator = {
      validarYObtenerEntidadesRelacionadas: jest.fn(),
    };
    usuarioValidator = { validarUsuarioExiste: jest.fn() };
    usuarioService = { findOne: jest.fn() };

    service = new ProductoService(
      repository,
      {} as any,
      {} as any,
      {} as any,
      usuarioService as any,
      new ProductoIntrinsicValidationService(),
      new ProductoValidationService(),
      relatedEntitiesValidator as any,
      new ProductoUniquenessValidator(repository),
      usuarioValidator as any,
      {} as any,
      presentacionAdapter,
    );
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (mysql) await mysql.stop();
  });

  it('CP - Registrar un producto con todos sus datos válidos', async () => {
    const base = await sembrarBase('cp18');
    enlazarMocks(base);

    const dto = crearDtoProducto('coca-cola gaseosas botella 1 l cp18', base.presentacion.id);
    const resultado = await service.create(dto as any);

    expect(resultado.mensaje).toContain('Producto creada');
    expect(resultado.mensaje).toContain(dto.denominacion);

    const creado = await productoRepo.findOne({
      where: { denominacion: dto.denominacion },
    });
    expect(creado).not.toBeNull();

    const entidad = await repository.findOne(creado.id);
    expect(entidad?.denominacion).toBe(dto.denominacion);
    expect(entidad?.costo).toBe(100);
  });

  it('CP - Rechazar una denominación duplicada al registrar', async () => {
    const base = await sembrarBase('cp22');
    enlazarMocks(base);

    const dto = crearDtoProducto('coca-cola gaseosas botella 1 l cp22', base.presentacion.id);
    const resultado = await service.create(dto as any);
    expect(resultado.mensaje).toContain('Producto creada');

    const error = await service.create(dto as any).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).message).toContain('ya está en uso');

    const cantidad = await productoRepo.count({
      where: { denominacion: dto.denominacion },
    });
    expect(cantidad).toBe(1);
  });

  it.each([200, 201])(
    'CP - Validar el límite de 200 caracteres de la denominación (%s caracteres)',
    async (longitud) => {
      const base = await sembrarBase(`cp23-${longitud}`);
      enlazarMocks(base);

      const dto = crearDtoProducto('X'.repeat(longitud), base.presentacion.id);

      if (longitud === 200) {
        const resultado = await service.create(dto as any);
        expect(resultado.mensaje).toContain('Producto creada');
        const cantidad = await productoRepo.count({
          where: { denominacion: dto.denominacion },
        });
        expect(cantidad).toBe(1);
      } else {
        const error = await service.create(dto as any).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain('200 caracteres');
        const cantidad = await productoRepo.count({
          where: { denominacion: dto.denominacion },
        });
        expect(cantidad).toBe(0);
      }
    },
  );

  it('CP - Rechazar el registro con una presentación que no está activa', async () => {
    const base = await sembrarBase('cp25');
    enlazarMocks(base);
    // Soft-delete de la presentación: mismo camino que el remove de producción.
    await presentacionAdapter.remove(base.presentacion, base.usuario);

    const dto = crearDtoProducto('coca-cola gaseosas botella 1 l cp25', base.presentacion.id);
    const error = await service.create(dto as any).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).message).toContain('no encontrada o eliminada');

    const cantidad = await productoRepo.count({
      where: { denominacion: dto.denominacion },
    });
    expect(cantidad).toBe(0);
  });

  function enlazarMocks(base: BaseSembrada) {
    relatedEntitiesValidator.validarYObtenerEntidadesRelacionadas.mockResolvedValue({
      marca: base.marca,
      linea: base.linea,
    });
    usuarioValidator.validarUsuarioExiste.mockResolvedValue(base.usuario);
    usuarioService.findOne.mockResolvedValue(base.usuario);
  }

  async function sembrarBase(sufijo: string): Promise<BaseSembrada> {
    const superLineaRepo = dataSource.getRepository(SuperLinea);
    const lineaRepo = dataSource.getRepository(Linea);
    const marcaRepo = dataSource.getRepository(Marca);
    const usuarioRepo = dataSource.getRepository(Usuario);
    const presentacionRepo = dataSource.getRepository(Presentacion);

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
    const presentacion = await presentacionRepo.save(
      presentacionRepo.create({ denominacion: `P-${sufijo}` }),
    );

    return { superLinea, linea, marca, usuario, presentacion };
  }

  function crearDtoProducto(denominacion: string, presentacionId: number) {
    return {
      denominacion,
      costo: 100,
      porcentaje: 20,
      stock: 10,
      stockMinimo: 5,
      marcaId: 1,
      lineaId: 1,
      presentacionId,
      alicuotaIva: 21,
      utilizaStockMinimo: true,
      utilizaPack: false,
      usuarioCreatedId: 1,
    };
  }
});

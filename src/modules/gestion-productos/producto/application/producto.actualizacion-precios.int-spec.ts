/**
 * Tests de integración de la ACTUALIZACIÓN MASIVA DE PRECIOS contra MySQL 8
 * real via Testcontainers: CP-40, CP-44 y CP-45.
 *
 * Cubre los casos de la feature "Gestión de productos" que requieren persistencia:
 * - CP - Actualizar precios de una línea mediante un único ajuste.
 * - CP - Rechazar una disminución que produzca algún precio no positivo.
 * - CP - Informar que no existen productos para actualizar.
 *
 * Requiere Docker corriendo. Sin Docker estos tests fallan (no pasan en silencio).
 * Se escribieron pero NO se ejecutaron localmente (Docker + @testcontainers/mysql
 * no disponibles en este entorno).
 */
import { DataSource } from 'typeorm';
import type { StartedMySqlContainer } from '@testcontainers/mysql';
import { NotFoundException } from '@nestjs/common';
import { startMySqlTestContainer } from '../../../../../test/integration/mysql-test-container';
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
import { TipoAumento } from 'src/modules/common/enums/tipo-aumento.emun';
import { OperacionAjuste } from 'src/modules/common/enums/operacion-ajuste.enum';

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

describe('Producto - actualización masiva de precios (integración servicio/repositorio + MySQL real)', () => {
  const databaseName = `producto_precios_integration_${process.pid}`;
  let mysql: StartedMySqlContainer;
  let dataSource: DataSource;
  let productoRepo: any;
  let cambioPrecioRepo: any;
  let service: ProductoService;
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
    cambioPrecioRepo = dataSource.getRepository(CambioPrecio);
    const adapter = new ProductoPersistenceAdapter(
      productoRepo,
      cambioPrecioRepo,
      dataSource,
      {} as IUnitOfWork,
    );
    const repository = new ProductoRepository(adapter);

    usuarioService = { findOne: jest.fn() };

    service = new ProductoService(
      repository,
      {} as any,
      {} as any,
      {} as any,
      usuarioService as any,
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

  it.each([
    ['AUMENTO', 'MONTO_FIJO', 20],
    ['DISMINUCION', 'MONTO_FIJO', 20],
    ['AUMENTO', 'PORCENTAJE', 10],
    ['DISMINUCION', 'PORCENTAJE', 10],
  ] as const)(
    'CP - Actualizar precios de una línea mediante un único ajuste (%s %s %s)',
    async (operacion, tipo, valor) => {
      const sufijo = `cp40-${operacion}-${tipo}-${valor}`;
      const baseGaseosas = await sembrarBase(sufijo);
      const baseOtras = await sembrarBase(`${sufijo}-otras`);
      usuarioService.findOne.mockResolvedValue(baseGaseosas.usuario);

      const p1 = await sembrarProductoDirecto(sufijo, baseGaseosas, {
        denominacion: `prod-${sufijo}-1`,
        costo: 100,
        precio: 100,
        porcentaje: 20,
      });
      const p2 = await sembrarProductoDirecto(sufijo, baseGaseosas, {
        denominacion: `prod-${sufijo}-2`,
        costo: 150,
        precio: 150,
        porcentaje: 20,
      });
      const p3 = await sembrarProductoDirecto(`${sufijo}-otras`, baseOtras, {
        denominacion: `prod-${sufijo}-otras`,
        costo: 100,
        precio: 100,
        porcentaje: 20,
      });

      const resultado = await service.actualizarPrecios(
        {
          lineaId: baseGaseosas.linea.id,
          tipoAjuste:
            tipo === 'MONTO_FIJO' ? TipoAumento.MONTO_FIJO : TipoAumento.PORCENTAJE,
          operacion: operacion as OperacionAjuste,
          valor,
        },
        { id: baseGaseosas.usuario.id },
      );

      expect(resultado.message).toBe('Actualización de precios realizada correctamente.');
      expect(resultado.productos).toHaveLength(2);

      const p1Db = await productoRepo.findOneBy({ id: p1.id });
      const p2Db = await productoRepo.findOneBy({ id: p2.id });
      const p3Db = await productoRepo.findOneBy({ id: p3.id });

      const esperado100 = calcularEsperado(operacion, tipo, valor, 100);
      const esperado150 = calcularEsperado(operacion, tipo, valor, 150);

      // Solo los productos de Gaseosas cambian; el de la otra línea conserva valores.
      expect(Number(p1Db.costo)).toBeCloseTo(esperado100.costo, 2);
      expect(Number(p1Db.precio)).toBeCloseTo(esperado100.precio, 2);
      expect(Number(p2Db.costo)).toBeCloseTo(esperado150.costo, 2);
      expect(Number(p2Db.precio)).toBeCloseTo(esperado150.precio, 2);
      expect(Number(p3Db.costo)).toBe(100);
      expect(Number(p3Db.precio)).toBe(100);

      const cambios = await cambioPrecioRepo.find({
        relations: { producto: true },
      });
      const cambiosGaseosas = cambios.filter(
        (c: any) => c.producto?.id === p1.id || c.producto?.id === p2.id,
      );
      expect(cambiosGaseosas).toHaveLength(2);
      expect(
        cambiosGaseosas.every(
          (c: any) => c.motivo === MotivoCambioPrecio.ActualizacionDePrecioPorLinea,
        ),
      ).toBe(true);
      expect(cambios.some((c: any) => c.producto?.id === p3.id)).toBe(false);
    },
  );

  it('CP - Rechazar una disminución que produzca algún precio no positivo', async () => {
    const base = await sembrarBase('cp44');
    usuarioService.findOne.mockResolvedValue(base.usuario);

    const p = await sembrarProductoDirecto('cp44', base, {
      denominacion: 'prod-cp44-precio-50',
      costo: 50,
      precio: 50,
      porcentaje: 20,
    });

    await expect(
      service.actualizarPrecios(
        {
          tipoAjuste: TipoAumento.MONTO_FIJO,
          operacion: OperacionAjuste.DISMINUCION,
          valor: 50,
        },
        { id: base.usuario.id },
      ),
    ).rejects.toThrow('El precio final debe ser mayor que 0.');

    // Nada quedó parcialmente actualizado: precios intactos y sin CambioPrecio.
    const pDb = await productoRepo.findOneBy({ id: p.id });
    expect(Number(pDb.costo)).toBe(50);
    expect(Number(pDb.precio)).toBe(50);

    const cambios = await cambioPrecioRepo.find({
      relations: { producto: true },
    });
    expect(cambios.some((c: any) => c.producto?.id === p.id)).toBe(false);
  });

  it('CP - Informar que no existen productos para actualizar', async () => {
    const base = await sembrarBase('cp45');
    usuarioService.findOne.mockResolvedValue(base.usuario);
    // La línea `cp45` no tiene productos asociados: no hay nada que actualizar.

    await expect(
      service.actualizarPrecios(
        {
          lineaId: base.linea.id,
          tipoAjuste: TipoAumento.PORCENTAJE,
          operacion: OperacionAjuste.AUMENTO,
          valor: 10,
        },
        { id: base.usuario.id },
      ),
    ).rejects.toThrow('No se encontraron productos para actualizar.');
  });

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

  async function sembrarProductoDirecto(
    sufijo: string,
    base: BaseSembrada,
    overrides: Partial<Producto> = {},
  ): Promise<Producto> {
    return productoRepo.save(
      productoRepo.create({
        denominacion: `prod-${sufijo}`,
        costo: 100,
        precio: 100,
        porcentaje: 20,
        stock: 10,
        stockMinimo: 5,
        linea: base.linea,
        lineaId: base.linea.id,
        marca: base.marca,
        marcaId: base.marca.id,
        presentacion: base.presentacion,
        presentacionId: base.presentacion.id,
        usuarioCreated: base.usuario,
        alicuotaIva: 21,
        utilizaStockMinimo: true,
        utilizaPack: false,
        ...overrides,
      }),
    );
  }

  function calcularEsperado(
    operacion: string,
    tipo: string,
    valor: number,
    precioBase: number,
  ): { precio: number; costo: number } {
    const precio =
      tipo === 'MONTO_FIJO'
        ? operacion === 'AUMENTO'
          ? precioBase + valor
          : precioBase - valor
        : operacion === 'AUMENTO'
          ? precioBase * (1 + valor / 100)
          : precioBase * (1 - valor / 100);
    const margen = 20;
    return { precio, costo: precio / (1 + margen / 100) };
  }
});
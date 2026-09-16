import 'reflect-metadata';
import { getMetadataArgsStorage } from 'typeorm';
import { CambioPrecio } from './cambio-precio.entity';
import { Producto } from './producto.entity';
import { MotivoCambioPrecio } from '../../enums/motivo-cambio-precio.enum';

function crearProductoConPrecio(precio = 100): Producto {
  const producto = new Producto();
  producto.precio = precio;
  producto.cambiosPrecio = [];
  return producto;
}

function cambioRegistrado(
  precioAnterior: number,
  precioNuevo: number,
  haceMilisegundos: number,
  motivo = MotivoCambioPrecio.ActualizacionDeCosto,
): CambioPrecio {
  const cambio = new CambioPrecio();
  cambio.precioAnterior = precioAnterior;
  cambio.precioNuevo = precioNuevo;
  cambio.fecha = new Date(Date.now() - haceMilisegundos);
  cambio.motivo = motivo;
  return cambio;
}

describe('Producto - registro de cambios de precio', () => {
  it('debe registrar un cambio con el precio anterior y actualizar el precio', () => {
    const producto = crearProductoConPrecio(100);

    producto.cambiarPrecio(150, MotivoCambioPrecio.ActualizacionDeCosto);

    expect(producto.cambiosPrecio).toHaveLength(1);
    const cambio = producto.cambiosPrecio[0];
    expect(cambio.precioAnterior).toBe(100);
    expect(cambio.precioNuevo).toBe(150);
    expect(cambio.motivo).toBe(MotivoCambioPrecio.ActualizacionDeCosto);
    expect(cambio.fecha).toBeInstanceOf(Date);
    expect(cambio.producto).toBe(producto);
    expect(producto.precio).toBe(150);
  });

  it('debe redondear el nuevo precio a 2 decimales', () => {
    const producto = crearProductoConPrecio(100);

    producto.cambiarPrecio(100.245, MotivoCambioPrecio.ActualizacionDeMargen);

    expect(producto.cambiosPrecio[0].precioNuevo).toBe(100.25);
    expect(producto.precio).toBe(100.25);
  });

  it('debe rechazar un nuevo precio no positivo o no finito', () => {
    const producto = crearProductoConPrecio(100);

    expect(() =>
      producto.cambiarPrecio(0, MotivoCambioPrecio.ActualizacionDeCosto),
    ).toThrow('El nuevo precio debe ser mayor que 0.');
    expect(() =>
      producto.cambiarPrecio(-5, MotivoCambioPrecio.ActualizacionDeCosto),
    ).toThrow('El nuevo precio debe ser mayor que 0.');
    expect(() =>
      producto.cambiarPrecio(NaN, MotivoCambioPrecio.ActualizacionDeCosto),
    ).toThrow('El nuevo precio debe ser mayor que 0.');
    expect(() =>
      producto.cambiarPrecio(Infinity, MotivoCambioPrecio.ActualizacionDeCosto),
    ).toThrow('El nuevo precio debe ser mayor que 0.');
    expect(producto.cambiosPrecio).toHaveLength(0);
  });

  it('debe rechazar un cambio sin motivo', () => {
    const producto = crearProductoConPrecio(100);

    expect(() => producto.cambiarPrecio(150, undefined)).toThrow(
      'El motivo del cambio de precio es obligatorio.',
    );
    expect(producto.cambiosPrecio).toHaveLength(0);
  });

  it('debe aceptar el primer cambio sin historial previo', () => {
    const producto = crearProductoConPrecio(100);

    expect(() =>
      producto.cambiarPrecio(120, MotivoCambioPrecio.ActualizacionDePrecioGlobal),
    ).not.toThrow();
    expect(producto.cambiosPrecio).toHaveLength(1);
  });

  it('debe rechazar el cambio cuando el último cambio no coincide con el precio actual', () => {
    const producto = crearProductoConPrecio(100);
    producto.cambiosPrecio = [cambioRegistrado(90, 200, 60_000)];

    expect(() =>
      producto.cambiarPrecio(150, MotivoCambioPrecio.ActualizacionDePrecioGlobal),
    ).toThrow(
      'El último cambio de precio no coincide con el precio actual del producto.',
    );
    expect(producto.cambiosPrecio).toHaveLength(1);
  });

  it('debe concatenar los cambios en orden de aplicación', () => {
    const producto = crearProductoConPrecio(100);

    producto.cambiarPrecio(120, MotivoCambioPrecio.ActualizacionDePrecioGlobal);
    producto.cambiarPrecio(130, MotivoCambioPrecio.ActualizacionDeCosto);

    expect(
      producto.cambiosPrecio.map((cambio) => [
        cambio.precioAnterior,
        cambio.precioNuevo,
      ]),
    ).toEqual([
      [100, 120],
      [120, 130],
    ]);
    expect(producto.precio).toBe(130);
  });

  it('obtenerUltimoCambioPrecio devuelve el cambio más reciente anterior a la fecha actual', () => {
    const producto = crearProductoConPrecio(130);
    const primero = cambioRegistrado(100, 110, 120_000);
    const ultimo = cambioRegistrado(110, 130, 60_000);
    producto.cambiosPrecio = [primero, ultimo];

    expect(producto.obtenerUltimoCambioPrecio()).toBe(ultimo);
  });

  it('obtenerUltimoCambioPrecio devuelve undefined sin historial', () => {
    const producto = crearProductoConPrecio(100);

    expect(producto.obtenerUltimoCambioPrecio()).toBeUndefined();
  });

  it('una asignación directa del precio no debe generar historial', () => {
    const producto = crearProductoConPrecio(100);
    producto.precio = 999;

    expect(producto.cambiosPrecio).toHaveLength(0);
  });
});

describe('CambioPrecio - metadatos de persistencia', () => {
  it('se persiste como tabla cambio_precio dentro del agregado Producto', () => {
    const tablas = getMetadataArgsStorage().tables.filter(
      (tarea) => tarea.target === CambioPrecio,
    );
    expect(tablas).toHaveLength(1);
    expect(tablas[0].name).toBe('cambio_precio');

    const columnas = getMetadataArgsStorage()
      .columns.filter((columna) => columna.target === CambioPrecio)
      .map((columna) => columna.options?.name ?? columna.propertyName);
    expect(columnas).toEqual(
      expect.arrayContaining([
        'id',
        'precioAnterior',
        'precioNuevo',
        'fecha',
        'motivo',
      ]),
    );

    const relacionProducto = getMetadataArgsStorage().relations.filter(
      (relacion) =>
        relacion.target === CambioPrecio && relacion.propertyName === 'producto',
    );
    expect(relacionProducto).toHaveLength(1);
    expect(relacionProducto[0].relationType).toBe('many-to-one');

    const relacionCambios = getMetadataArgsStorage().relations.filter(
      (relacion) =>
        relacion.target === Producto &&
        relacion.propertyName === 'cambiosPrecio',
    );
    expect(relacionCambios).toHaveLength(1);
    expect(relacionCambios[0].relationType).toBe('one-to-many');
  });
});

describe('MotivoCambioPrecio', () => {
  it('define los motivos de cambio aceptados', () => {
    expect(MotivoCambioPrecio).toEqual({
      ActualizacionDeCosto: 'ActualizacionDeCosto',
      ActualizacionDeMargen: 'ActualizacionDeMargen',
      ActualizacionDePrecioPorLinea: 'ActualizacionDePrecioPorLinea',
      ActualizacionDePrecioGlobal: 'ActualizacionDePrecioGlobal',
      ActualizacionDePrecioDirecta: 'ActualizacionDePrecioDirecta',
    });
  });
});
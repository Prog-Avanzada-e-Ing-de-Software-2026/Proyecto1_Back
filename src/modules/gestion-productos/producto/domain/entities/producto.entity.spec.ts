import { Producto } from './producto.entity';
import { CambioPrecio } from './cambio-precio.entity';
import { MotivoCambioPrecio } from '../../enums/motivo-cambio-precio.enum';

describe('Producto - actualización de precio', () => {
  it('debe aumentar el precio por porcentaje y conservar el margen porcentual', () => {
    const producto = new Producto();
    producto.costo = 100;
    producto.precio = 120;
    producto.porcentaje = 20;

    producto.aumentarPrecioPorPorcentaje(
      10,
      MotivoCambioPrecio.ActualizacionDePrecioGlobal,
    );

    expect(producto.precio).toBeCloseTo(132);
    expect(producto.costo).toBeCloseTo(110);
    expect(producto.porcentaje).toBe(20);
  });

  it('debe disminuir el precio por monto y conservar el margen porcentual', () => {
    const producto = new Producto();
    producto.costo = 100;
    producto.precio = 120;
    producto.porcentaje = 20;

    producto.disminuirPrecioPorMonto(
      20,
      MotivoCambioPrecio.ActualizacionDePrecioGlobal,
    );

    expect(producto.precio).toBeCloseTo(100);
    expect(producto.costo).toBeCloseTo(83.33333333333333);
    expect(producto.porcentaje).toBe(20);
  });

  it('debe rechazar un valor de ajuste no positivo', () => {
    const producto = new Producto();
    producto.costo = 100;
    producto.precio = 120;
    producto.porcentaje = 20;

    expect(() =>
      producto.aumentarPrecioPorMonto(0, MotivoCambioPrecio.ActualizacionDePrecioGlobal),
    ).toThrow('El valor del ajuste debe ser mayor que 0.');
    expect(() =>
      producto.aumentarPrecioPorPorcentaje(-10, MotivoCambioPrecio.ActualizacionDePrecioGlobal),
    ).toThrow('El valor del ajuste debe ser mayor que 0.');
  });

  it('debe rechazar una disminución que deja el precio en cero o negativo', () => {
    const producto = new Producto();
    producto.costo = 100;
    producto.precio = 120;
    producto.porcentaje = 20;

    expect(() =>
      producto.disminuirPrecioPorMonto(999999, MotivoCambioPrecio.ActualizacionDePrecioGlobal),
    ).toThrow('El precio final debe ser mayor que 0.');
  });

  it('debe registrar el cambio de precio con el motivo del ajuste global', () => {
    const producto = new Producto();
    producto.costo = 100;
    producto.precio = 120;
    producto.porcentaje = 20;

    producto.aumentarPrecioPorPorcentaje(
      10,
      MotivoCambioPrecio.ActualizacionDePrecioGlobal,
    );

    expect(producto.cambiosPrecio).toHaveLength(1);
    const cambio = producto.cambiosPrecio[0];
    expect(cambio.motivo).toBe(MotivoCambioPrecio.ActualizacionDePrecioGlobal);
    expect(cambio.precioAnterior).toBe(120);
    expect(cambio.precioNuevo).toBeCloseTo(132);
    expect(cambio.producto).toBe(producto);
  });

  it('debe registrar el ajuste por línea con su motivo', () => {
    const producto = new Producto();
    producto.costo = 100;
    producto.precio = 120;
    producto.porcentaje = 20;

    producto.disminuirPrecioPorMonto(
      10,
      MotivoCambioPrecio.ActualizacionDePrecioPorLinea,
    );

    expect(producto.cambiosPrecio).toHaveLength(1);
    expect(producto.cambiosPrecio[0].motivo).toBe(
      MotivoCambioPrecio.ActualizacionDePrecioPorLinea,
    );
    expect(producto.precio).toBeCloseTo(110);
  });

  it('cambiarPrecio directo no recalcula el costo', () => {
    const producto = new Producto();
    producto.costo = 100;
    producto.precio = 120;
    producto.porcentaje = 20;

    producto.cambiarPrecio(
      150,
      MotivoCambioPrecio.ActualizacionDePrecioDirecta,
    );

    expect(producto.precio).toBe(150);
    expect(producto.costo).toBe(100);
    expect(producto.cambiosPrecio).toHaveLength(1);
    expect(producto.cambiosPrecio[0].precioAnterior).toBe(120);
    expect(producto.cambiosPrecio[0].precioNuevo).toBe(150);
    expect(producto.cambiosPrecio[0].motivo).toBe(
      MotivoCambioPrecio.ActualizacionDePrecioDirecta,
    );
  });

  it('debe rechazar cambiar el precio sin motivo', () => {
    const producto = new Producto();
    producto.costo = 100;
    producto.precio = 120;

    expect(() => producto.cambiarPrecio(150, undefined)).toThrow(
      'El motivo del cambio de precio es obligatorio.',
    );
  });

  it('debe rechazar un cambio cuyo precio final no coincide con el último cambio registrado', () => {
    const producto = new Producto();
    producto.costo = 100;
    producto.precio = 120;

    const ultimoCambio = new CambioPrecio();
    ultimoCambio.precioAnterior = 100;
    ultimoCambio.precioNuevo = 110;
    ultimoCambio.fecha = new Date(Date.now() - 1000);
    producto.cambiosPrecio = [ultimoCambio];

    expect(() =>
      producto.cambiarPrecio(150, MotivoCambioPrecio.ActualizacionDePrecioGlobal),
    ).toThrow('El último cambio de precio no coincide con el precio actual del producto.');
  });

  describe('Historial de precios - Casos de prueba (unitarios)', () => {
    it('Detectar inconsistencia en la continuidad del historial de precios', () => {
      const producto = new Producto();
      producto.precio = 100;

      const cambio = new CambioPrecio();
      cambio.precioAnterior = 80;
      cambio.precioNuevo = 80;
      cambio.fecha = new Date(Date.now() - 1000);
      producto.cambiosPrecio = [cambio];

      expect(producto.precio).toBe(100);
      expect(() =>
        producto.cambiarPrecio(120, MotivoCambioPrecio.ActualizacionDePrecioDirecta),
      ).toThrow('El último cambio de precio no coincide con el precio actual del producto.');
      expect(producto.precio).toBe(100);
      expect(producto.cambiosPrecio).toHaveLength(1);
    });

    it.each([0, -10])(
      'Intentar cambiar el precio a %s (no positivo)',
      (precioInvalido) => {
        const producto = new Producto();
        producto.precio = 100;

        expect(() =>
          producto.cambiarPrecio(precioInvalido, MotivoCambioPrecio.ActualizacionDePrecioDirecta),
        ).toThrow('El nuevo precio debe ser mayor que 0.');
        expect(producto.precio).toBe(100);
        expect(producto.cambiosPrecio ?? []).toHaveLength(0);
      },
    );

    it('Intentar cambiar el precio sin informar el motivo', () => {
      const producto = new Producto();
      producto.precio = 100;

      expect(() => producto.cambiarPrecio(120, undefined)).toThrow(
        'El motivo del cambio de precio es obligatorio.',
      );
      expect(producto.precio).toBe(100);
      expect(producto.cambiosPrecio ?? []).toHaveLength(0);
    });
  });
});
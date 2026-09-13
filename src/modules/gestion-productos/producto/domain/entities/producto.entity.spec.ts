import { Producto } from './producto.entity';

describe('Producto - actualización de precio', () => {
  it('debe aumentar el precio por porcentaje y conservar el margen porcentual', () => {
    const producto = new Producto();
    producto.costo = 100;
    producto.precio = 120;
    producto.porcentaje = 20;

    producto.aumentarPrecioPorPorcentaje(10);

    expect(producto.precio).toBeCloseTo(132);
    expect(producto.costo).toBeCloseTo(110);
    expect(producto.porcentaje).toBe(20);
  });

  it('debe disminuir el precio por monto y conservar el margen porcentual', () => {
    const producto = new Producto();
    producto.costo = 100;
    producto.precio = 120;
    producto.porcentaje = 20;

    producto.disminuirPrecioPorMonto(20);

    expect(producto.precio).toBeCloseTo(100);
    expect(producto.costo).toBeCloseTo(83.33333333333333);
    expect(producto.porcentaje).toBe(20);
  });

  it('debe rechazar un valor de ajuste no positivo', () => {
    const producto = new Producto();
    producto.costo = 100;
    producto.precio = 120;
    producto.porcentaje = 20;

    expect(() => producto.aumentarPrecioPorMonto(0)).toThrow(
      'El valor del ajuste debe ser mayor que 0.',
    );
    expect(() => producto.aumentarPrecioPorPorcentaje(-10)).toThrow(
      'El valor del ajuste debe ser mayor que 0.',
    );
  });

  it('debe rechazar una disminución que deja el precio en cero o negativo', () => {
    const producto = new Producto();
    producto.costo = 100;
    producto.precio = 120;
    producto.porcentaje = 20;

    expect(() => producto.disminuirPrecioPorMonto(999999)).toThrow(
      'El precio final debe ser mayor que 0.',
    );
  });
});

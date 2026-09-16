/**
 * Test unitario (domain) de la política de eliminación de marcas (CP-16).
 *
 * La feature "Gestión de marca" se reparte así:
 *  - Unitario (este archivo, en domain): CP-16 con IProductoRepository fake.
 *  - Integración (en application, MySQL real): CP-11 y CP-16 en
 *    marca.integracion.spec.ts.
 *  - HTTP end-to-end (en application): CP-10, CP-12, CP-13, CP-14, CP-15 y
 *    CP-17 en marca.http.spec.ts.
 */
import { PoliticaEliminacionMarca } from './politica-eliminacion-marca.service';
import { IProductoRepository } from '../../../producto/domain/interfaces/producto.repository-interface';

describe('Marca - Política de eliminación (unitarios)', () => {
  it('CP-16 - Rechazar la eliminación cuando la marca tiene productos activos', async () => {
    const existsProductosActivosByMarca = jest.fn().mockResolvedValue(true);
    const productoRepository = {
      existsProductosActivosByMarca,
    } as unknown as IProductoRepository;

    const politica = new PoliticaEliminacionMarca(productoRepository);

    await expect(politica.tieneProductosActivosParaMarca(1)).resolves.toBe(
      true,
    );
    expect(existsProductosActivosByMarca).toHaveBeenCalledWith(1);
  });

  it('CP-16b - Permitir la eliminación cuando no hay productos activos', async () => {
    const existsProductosActivosByMarca = jest.fn().mockResolvedValue(false);
    const productoRepository = {
      existsProductosActivosByMarca,
    } as unknown as IProductoRepository;

    const politica = new PoliticaEliminacionMarca(productoRepository);

    await expect(politica.tieneProductosActivosParaMarca(1)).resolves.toBe(
      false,
    );
    expect(existsProductosActivosByMarca).toHaveBeenCalledWith(1);
  });
});
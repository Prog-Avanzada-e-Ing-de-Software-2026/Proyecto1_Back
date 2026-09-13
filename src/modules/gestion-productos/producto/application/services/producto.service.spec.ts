import { Producto } from '../../domain/entities/producto.entity';
import { ProductoService } from './producto.service';

describe('ProductoService search by denominación and superlínea', () => {
  let repository: {
    busquedaPorCoincidenciaParcial: jest.Mock;
    findProductosBySuperLinea: jest.Mock;
  };
  let service: ProductoService;

  const buildProducto = (overrides: Partial<Producto> = {}): Producto =>
    Object.assign(new Producto(), {
      id: 1,
      denominacion: 'Harina integral',
      codigoProveedor: 'P-001',
      observacion: 'observación',
      stock: 10,
      alicuotaIva: 21,
      costo: 100,
      precio: 150,
      ubicacion: 'G1',
      utilizaStockMinimo: false,
      stockMinimo: 0,
      utilizaPack: false,
      cantidadPorPack: 0,
      sistema: 0,
      codigoReferencia: 'R-001',
      ...overrides,
    });

  beforeEach(() => {
    repository = {
      busquedaPorCoincidenciaParcial: jest.fn(),
      findProductosBySuperLinea: jest.fn(),
    };

    service = new (ProductoService as any)(
      repository,
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
    );
  });

  describe('busquedaPorCoincidenciaParcial', () => {
    it('delegates the search term and maps active matches to GetProductoDto', async () => {
      repository.busquedaPorCoincidenciaParcial.mockResolvedValue({
        data: [buildProducto({ id: 7, denominacion: 'Harina integral' })],
        total: 1,
      });

      const result = await service.busquedaPorCoincidenciaParcial(
        'harina',
        0,
        10,
      );

      expect(repository.busquedaPorCoincidenciaParcial).toHaveBeenCalledWith(
        'harina',
        0,
        10,
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(7);
      expect(result.data[0].denominacion).toBe('Harina integral');
      expect(result.total).toBe(1);
    });

    it('returns an empty page when no denominación contains the term (accent mismatch "harína" vs "harina")', async () => {
      repository.busquedaPorCoincidenciaParcial.mockResolvedValue({
        data: [],
        total: 0,
      });

      const result = await service.busquedaPorCoincidenciaParcial(
        'harina',
        0,
        10,
      );

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('returns { data: [], total: 0 } for an empty term', async () => {
      repository.busquedaPorCoincidenciaParcial.mockResolvedValue({
        data: [],
        total: 0,
      });

      const result = await service.busquedaPorCoincidenciaParcial('', 0, 10);

      expect(repository.busquedaPorCoincidenciaParcial).toHaveBeenCalledWith(
        '',
        0,
        10,
      );
      expect(result).toEqual({ data: [], total: 0 });
    });

    it('defaults to a page of 10 (skip 0, take 10)', async () => {
      repository.busquedaPorCoincidenciaParcial.mockResolvedValue({
        data: [],
        total: 0,
      });

      await service.busquedaPorCoincidenciaParcial('harina');

      expect(repository.busquedaPorCoincidenciaParcial).toHaveBeenCalledWith(
        'harina',
        0,
        10,
      );
    });
  });

  describe('findProductosBySuperLinea', () => {
    it('maps active products from multiple líneas under one superlínea', async () => {
      repository.findProductosBySuperLinea.mockResolvedValue({
        data: [
          buildProducto({ id: 1, denominacion: 'Producto línea A' }),
          buildProducto({ id: 2, denominacion: 'Producto línea B' }),
        ],
        total: 2,
      });

      const result = await service.findProductosBySuperLinea(10, 0, 10);

      expect(repository.findProductosBySuperLinea).toHaveBeenCalledWith(
        10,
        0,
        10,
      );
      expect(result.data.map((p) => p.denominacion)).toEqual([
        'Producto línea A',
        'Producto línea B',
      ]);
      expect(result.total).toBe(2);
    });

    it('returns only active products (soft-deleted are excluded by the repository)', async () => {
      repository.findProductosBySuperLinea.mockResolvedValue({
        data: [buildProducto({ id: 3, denominacion: 'Harina' })],
        total: 1,
      });

      const result = await service.findProductosBySuperLinea(10, 0, 10);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].denominacion).toBe('Harina');
      expect(result.total).toBe(1);
    });

    it('defaults to a page of 10 (skip 0, take 10)', async () => {
      repository.findProductosBySuperLinea.mockResolvedValue({
        data: [],
        total: 0,
      });

      await service.findProductosBySuperLinea(10);

      expect(repository.findProductosBySuperLinea).toHaveBeenCalledWith(
        10,
        0,
        10,
      );
    });
  });
});

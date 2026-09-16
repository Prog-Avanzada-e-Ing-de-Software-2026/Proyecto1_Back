import { DataSource } from 'typeorm';
import { Linea } from 'src/modules/gestion-productos/linea/domain/entities/linea.entity';
import { Marca } from 'src/modules/gestion-productos/marca/domain/entities/marca.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { Producto } from '../../domain/entities/producto.entity';
import { MotivoCambioPrecio } from '../../enums/motivo-cambio-precio.enum';
import { UpdateProductoDto } from '../../dto/update-producto.dto';
import { ProductoPersistenceAdapter } from './producto.persistence-adapters';

describe('ProductoPersistenceAdapter.update', () => {
  let mockRepo: { save: jest.Mock };
  let mockQueryRunner: any;
  let mockDataSource: any;

  const linea = { id: 1 } as Linea;
  const marca = { id: 1 } as Marca;
  const usuario = { id: 4 } as Usuario;

  beforeEach(() => {
    mockRepo = {
      save: jest.fn().mockImplementation(async (entity: Producto) => entity),
    };
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: { getRepository: jest.fn().mockReturnValue(mockRepo) },
    };
    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as unknown as DataSource;
  });

  const buildAdapter = () =>
    new ProductoPersistenceAdapter(
      {} as any,
      {} as any,
      mockDataSource as any,
      {} as any,
    );

  const buildProducto = () => {
    const producto = new Producto();
    producto.costo = 100;
    producto.precio = 120;
    producto.porcentaje = 20;
    return producto;
  };

  it('registra un cambio de precio cuando el precio difiere del actual', async () => {
    const adapter = buildAdapter();
    const producto = buildProducto();
    jest.spyOn(adapter, 'findOne').mockResolvedValue(producto);

    await adapter.update(1, { precio: 150 } as UpdateProductoDto, linea, marca, usuario);

    expect(producto.precio).toBe(150);
    expect(producto.cambiosPrecio).toHaveLength(1);
    expect(producto.cambiosPrecio[0].precioAnterior).toBe(120);
    expect(producto.cambiosPrecio[0].precioNuevo).toBe(150);
    expect(producto.cambiosPrecio[0].motivo).toBe(
      MotivoCambioPrecio.ActualizacionDePrecioDirecta,
    );
    expect(mockRepo.save).toHaveBeenCalledWith(producto);
  });

  it('no registra un cambio de precio cuando el precio no difiere del actual', async () => {
    const adapter = buildAdapter();
    const producto = buildProducto();
    jest.spyOn(adapter, 'findOne').mockResolvedValue(producto);

    await adapter.update(1, { precio: 120 } as UpdateProductoDto, linea, marca, usuario);

    expect(producto.precio).toBe(120);
    expect(producto.costo).toBe(100);
    expect(producto.cambiosPrecio).toBeUndefined();
    expect(mockRepo.save).toHaveBeenCalledWith(producto);
  });
});
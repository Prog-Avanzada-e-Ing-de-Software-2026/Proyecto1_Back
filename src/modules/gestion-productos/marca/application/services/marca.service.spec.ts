import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { MarcaService } from './marca.service';
import { IMarcaRepository } from '../../domain/interfaces/marca.repository.interface';
import { Marca } from '../../domain/entities/marca.entity';
import { MarcaMapper } from '../../mappers/marca.mapper';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { PoliticaEliminacionMarca } from '../../domain/services/politica-eliminacion-marca.service';

describe('MarcaService', () => {
  let service: MarcaService;
  let repository: jest.Mocked<IMarcaRepository>;

  const mockRepository = {
    findBy: jest.fn(),
    findByDenominacionWith: jest.fn(),
    create: jest.fn(),
  };

  const mockUsuarioService = {
    findOne: jest.fn(),
  };

  const mockPoliticaEliminacion = {
    tieneProductosActivosParaMarca: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarcaService,
        { provide: 'IMarcaRepository', useValue: mockRepository },
        { provide: UsuarioService, useValue: mockUsuarioService },
        {
          provide: PoliticaEliminacionMarca,
          useValue: mockPoliticaEliminacion,
        },
      ],
    }).compile();

    service = module.get<MarcaService>(MarcaService);
    repository = module.get('IMarcaRepository');
  });

  describe('findBy', () => {
    it('delegates to the repository and maps the result through MarcaMapper', async () => {
      const marca = new Marca();
      marca.id = 1;
      marca.denominacion = 'Nike';
      marca.observacion = 'deportiva';
      marca.sistema = 0;

      repository.findBy.mockResolvedValue({ data: [marca], total: 1 });

      const result = await service.findBy('nike', 0, 10, false);

      expect(repository.findBy).toHaveBeenCalledWith('nike', 0, 10, false);
      expect(result.data).toEqual([MarcaMapper.toDto(marca)]);
      expect(result.total).toBe(1);
    });
  });

  describe('create', () => {
    it('throws ConflictException when the denominacion belongs to another marca', async () => {
      repository.findByDenominacionWith.mockResolvedValue({
        id: 2,
        denominacion: 'Nike',
      } as Marca);

      await expect(
        service.create({ denominacion: 'Nike', usuarioCreatedId: 1 }),
      ).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });
});

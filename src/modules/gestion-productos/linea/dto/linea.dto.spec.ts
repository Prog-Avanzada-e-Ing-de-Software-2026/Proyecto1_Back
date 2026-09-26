import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateLineaDto } from './create-linea.dto';
import { UpdateLineaDto } from './update-linea.dto';

describe('Validación de DTOs de Línea', () => {
  const validCreate = {
    denominacion: 'a'.repeat(255),
    utilizaStockMinimo: false,
    usuarioCreatedId: 7,
    superLineaId: 10,
  };

  it.each([
    ['superLineaId omitido', { ...validCreate, superLineaId: undefined }, 'superLineaId'],
    ['superLineaId nulo', { ...validCreate, superLineaId: null }, 'superLineaId'],
    ['una denominación vacía', { ...validCreate, denominacion: '' }, 'denominacion'],
    ['una denominación de 256 caracteres', { ...validCreate, denominacion: 'a'.repeat(256) }, 'denominacion'],
  ])('Rechaza el registro con %s', async (_, input, property) => {
    // Arrange
    const dto = plainToInstance(CreateLineaDto, input);

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property })]),
    );
  });

  it('Acepta una denominación de 255 caracteres', async () => {
    const dto = plainToInstance(CreateLineaDto, validCreate);

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it.each([
    ['', 'denominacion'],
    ['a'.repeat(256), 'denominacion'],
  ])('Rechaza una denominación inválida al modificar una Línea', async (denominacion, property) => {
    const dto = plainToInstance(UpdateLineaDto, {
      denominacion,
      usuarioUpdatedId: 8,
    });

    const errors = await validate(dto);

    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property })]),
    );
  });

  it('Rechaza la reasignación de la SuperLínea a un valor nulo', async () => {
    const dto = plainToInstance(UpdateLineaDto, {
      superLineaId: null,
      usuarioUpdatedId: 8,
    });

    const errors = await validate(dto);

    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: 'superLineaId' })]),
    );
  });
});

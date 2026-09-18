import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateLineaDto } from './create-linea.dto';
import { UpdateLineaDto } from './update-linea.dto';

describe('Linea DTO validation', () => {
  const validCreate = {
    denominacion: 'a'.repeat(255),
    utilizaStockMinimo: false,
    usuarioCreatedId: 7,
    superLineaId: 10,
  };

  it.each([
    ['omitted', { ...validCreate, superLineaId: undefined }, 'superLineaId'],
    ['null', { ...validCreate, superLineaId: null }, 'superLineaId'],
    ['an empty denomination', { ...validCreate, denominacion: '' }, 'denominacion'],
    ['a 256-character denomination', { ...validCreate, denominacion: 'a'.repeat(256) }, 'denominacion'],
  ])('CP-48/CP-49 - rejects creation with %s', async (_, input, property) => {
    // Arrange
    const dto = plainToInstance(CreateLineaDto, input);

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property })]),
    );
  });

  it('CP-49 - accepts a 255-character denomination', async () => {
    const dto = plainToInstance(CreateLineaDto, validCreate);

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it.each([
    ['', 'denominacion'],
    ['a'.repeat(256), 'denominacion'],
  ])('CP-53 - rejects an invalid update denomination', async (denominacion, property) => {
    const dto = plainToInstance(UpdateLineaDto, {
      denominacion,
      usuarioUpdatedId: 8,
    });

    const errors = await validate(dto);

    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property })]),
    );
  });

  it('CP-52 - rejects a null SuperLinea reassignment', async () => {
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

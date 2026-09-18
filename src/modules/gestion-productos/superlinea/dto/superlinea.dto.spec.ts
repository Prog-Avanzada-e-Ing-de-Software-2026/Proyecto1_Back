import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsUniqueDenominacionConstraint } from '../domain/validator/unique-denominacion.validator';
import { CreateSuperLineaDto } from './create-superlinea.dto';
import { UpdateSuperLineaDto } from './update-superlinea.dto';

describe('SuperLinea DTO validation', () => {
  beforeEach(() => {
    jest
      .spyOn(IsUniqueDenominacionConstraint.prototype, 'validate')
      .mockResolvedValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  it.each([
    [undefined, true],
    ['Con observación', true],
  ])('CP-57 - accepts an optional observation: %s', async (observacion, valid) => {
    const dto = plainToInstance(CreateSuperLineaDto, {
      denominacion: 'Bebidas',
      usuarioCreatedId: 7,
      observacion,
    });

    const errors = await validate(dto);

    expect(errors.every((error) => error.property !== 'observacion')).toBe(valid);
  });

  it.each([
    ['', false],
    ['a'.repeat(255), true],
    ['a'.repeat(256), false],
  ])('CP-58 - validates creation denomination length', async (denominacion, valid) => {
    const dto = plainToInstance(CreateSuperLineaDto, {
      denominacion,
      usuarioCreatedId: 7,
    });

    const errors = await validate(dto);

    expect(errors.every((error) => error.property !== 'denominacion')).toBe(valid);
  });

  it.each([
    ['', false],
    ['a'.repeat(255), true],
    ['a'.repeat(256), false],
  ])('CP-63 - validates update denomination length', async (denominacion, valid) => {
    const dto = plainToInstance(UpdateSuperLineaDto, {
      denominacion,
      usuarioUpdatedId: 8,
    });

    const errors = await validate(dto);

    expect(errors.every((error) => error.property !== 'denominacion')).toBe(valid);
  });
});

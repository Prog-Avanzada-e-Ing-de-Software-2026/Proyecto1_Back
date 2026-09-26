import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSuperLineaDto } from './create-superlinea.dto';
import { UpdateSuperLineaDto } from './update-superlinea.dto';

describe('Validación de DTOs de SuperLínea', () => {
  beforeEach(() => {});

  afterEach(() => jest.restoreAllMocks());

  it.each([
    [undefined, true],
    ['Con observación', true],
  ])('Acepta una observación opcional: %s', async (observacion, valid) => {
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
  ])('Valida la longitud de la denominación al registrar', async (denominacion, valid) => {
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
  ])('Valida la longitud de la denominación al modificar', async (denominacion, valid) => {
    const dto = plainToInstance(UpdateSuperLineaDto, {
      denominacion,
      usuarioUpdatedId: 8,
    });

    const errors = await validate(dto);

    expect(errors.every((error) => error.property !== 'denominacion')).toBe(valid);
  });
});

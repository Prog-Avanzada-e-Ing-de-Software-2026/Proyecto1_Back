import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SelectLineaDto } from './select-linea.dto';

// Mirrors the global ValidationPipe options declared in src/main.ts.
const validationOptions = { whitelist: true, forbidNonWhitelisted: true };

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(SelectLineaDto, payload), validationOptions);

describe('SelectLineaDto', () => {
  it('accepts an optional denominacion string', async () => {
    const errors = await validateDto({ denominacion: 'harina' });

    expect(errors).toHaveLength(0);
  });

  it('accepts an empty payload', async () => {
    const errors = await validateDto({});

    expect(errors).toHaveLength(0);
  });

  it('rejects a non-string denominacion with exactly one error on denominacion', async () => {
    const errors = await validateDto({ denominacion: 123 });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('denominacion');
    expect(errors[0].constraints).toHaveProperty('isString');
  });
});

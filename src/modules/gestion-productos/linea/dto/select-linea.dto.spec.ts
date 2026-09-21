import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SelectLineaDto } from './select-linea.dto';

// Mirrors the global ValidationPipe options declared in src/main.ts.
const validationOptions = { whitelist: true, forbidNonWhitelisted: true };

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(SelectLineaDto, payload), validationOptions);

describe('SelectLineaDto', () => {
  it('Acepta una denominación opcional de tipo string', async () => {
    const errors = await validateDto({ denominacion: 'harina' });

    expect(errors).toHaveLength(0);
  });

  it('Acepta un payload vacío (sin término de búsqueda)', async () => {
    const errors = await validateDto({});

    expect(errors).toHaveLength(0);
  });
});

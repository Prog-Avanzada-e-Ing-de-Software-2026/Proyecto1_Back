import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SearchProductoSuperlineaDto } from './search-producto-superlinea.dto';

// Mirrors the global ValidationPipe options declared in src/main.ts.
const validationOptions = { whitelist: true, forbidNonWhitelisted: true };

const validateDto = (payload: Record<string, unknown>) =>
  validate(plainToInstance(SearchProductoSuperlineaDto, payload), validationOptions);

describe('SearchProductoSuperlineaDto', () => {
  it('accepts a superLineaId and applies the pagination defaults', async () => {
    const dto = plainToInstance(SearchProductoSuperlineaDto, {
      superLineaId: 5,
    });

    expect(dto.skip).toBe(0);
    expect(dto.take).toBe(10);

    const errors = await validate(dto, validationOptions);
    expect(errors).toHaveLength(0);
  });

  it('rejects a missing superLineaId', async () => {
    const errors = await validateDto({ skip: 0, take: 10 });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('superLineaId');
    expect(errors[0].constraints).toHaveProperty('isInt');
  });

  it('rejects a non-numeric superLineaId', async () => {
    const errors = await validateDto({ superLineaId: 'abc' });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('superLineaId');
    expect(errors[0].constraints).toHaveProperty('isInt');
  });

  it('rejects a negative skip and resolves the message to the skip field', async () => {
    const errors = await validateDto({ superLineaId: 5, skip: -1 });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('skip');
    expect(errors[0].constraints?.min).toBe(
      'skip debe ser un número entero positivo o 0',
    );
  });

  it('rejects take = 0 and resolves the message to the take field', async () => {
    const errors = await validateDto({ superLineaId: 5, take: 0 });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('take');
    expect(errors[0].constraints?.min).toBe(
      'take debe ser un número entero mayor que 0',
    );
  });
});

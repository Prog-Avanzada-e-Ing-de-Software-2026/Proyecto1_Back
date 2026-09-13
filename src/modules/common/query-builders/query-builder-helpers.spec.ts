import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { QueryBuilderHelper } from './query-builder-helpers';

describe('QueryBuilderHelper.applyPartialCoincidence', () => {
  function createMockQueryBuilder() {
    const andWhere = jest.fn().mockReturnThis();
    const query = { andWhere } as unknown as SelectQueryBuilder<ObjectLiteral>;
    return { query, andWhere };
  }

  it('emits a case-insensitive, accent-sensitive containment fragment with its parameter', () => {
    const { query, andWhere } = createMockQueryBuilder();

    const result = QueryBuilderHelper.applyPartialCoincidence(
      query,
      'producto',
      'denominacion',
      'harina',
    );

    expect(andWhere).toHaveBeenCalledTimes(1);
    expect(andWhere).toHaveBeenCalledWith(
      "LOWER(producto.denominacion) COLLATE utf8mb4_bin LIKE CONCAT('%', LOWER(:termino), '%') COLLATE utf8mb4_bin",
      { termino: 'harina' },
    );
    expect(result).toBe(query);
  });

  it('interpolates a different alias and campo into the fragment', () => {
    const { query, andWhere } = createMockQueryBuilder();

    QueryBuilderHelper.applyPartialCoincidence(query, 'l', 'denominacion', 'integral');

    expect(andWhere).toHaveBeenCalledWith(
      "LOWER(l.denominacion) COLLATE utf8mb4_bin LIKE CONCAT('%', LOWER(:termino), '%') COLLATE utf8mb4_bin",
      { termino: 'integral' },
    );
  });

  it('returns the same query builder instance to preserve chaining', () => {
    const { query } = createMockQueryBuilder();

    const result = QueryBuilderHelper.applyPartialCoincidence(
      query,
      'p',
      'denominacion',
      'harina',
    );

    expect(result).toBe(query);
  });
});

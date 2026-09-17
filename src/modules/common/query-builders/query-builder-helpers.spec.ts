import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { QueryBuilderHelper } from './query-builder-helpers';

describe('QueryBuilderHelper.applyPartialCoincidence', () => {
  function createMockQueryBuilder() {
    const andWhere = jest.fn().mockReturnThis();
    const query = { andWhere } as unknown as SelectQueryBuilder<ObjectLiteral>;
    return { query, andWhere };
  }

  it('CP-70 - Genera un fragmento de contención que no distingue mayúsculas de minúsculas', () => {
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

  it('CP-74 - Escapa el comodín % para que el término se busque literal', () => {
    const { query, andWhere } = createMockQueryBuilder();

    QueryBuilderHelper.applyPartialCoincidence(
      query,
      'producto',
      'denominacion',
      '%',
    );

    expect(andWhere).toHaveBeenCalledWith(
      "LOWER(producto.denominacion) COLLATE utf8mb4_bin LIKE CONCAT('%', LOWER(:termino), '%') COLLATE utf8mb4_bin",
      { termino: '\\%' },
    );
  });

  it('CP-75 - Escapa el comodín _ para que el término se busque literal', () => {
    const { query, andWhere } = createMockQueryBuilder();

    QueryBuilderHelper.applyPartialCoincidence(
      query,
      'producto',
      'denominacion',
      '_',
    );

    expect(andWhere).toHaveBeenCalledWith(
      "LOWER(producto.denominacion) COLLATE utf8mb4_bin LIKE CONCAT('%', LOWER(:termino), '%') COLLATE utf8mb4_bin",
      { termino: '\\_' },
    );
  });
});

import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

export class QueryBuilderHelper {

  static applyDeletedFilter<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    incluirEliminados: boolean,
  ): SelectQueryBuilder<T> {
    if (incluirEliminados) {
      query.withDeleted();
    }
    return query;
  }

  static applyPagination<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    skip = 0,
    take = 10,
  ): SelectQueryBuilder<T> {
    return query.skip(skip).take(take);
  }

  static applyOrder<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    alias: string,
    campo: string,
    orden: 'ASC' | 'DESC' = 'ASC',
  ): SelectQueryBuilder<T> {
    return query.orderBy(`${alias}.${campo}`, orden);
  }

  static applyPartialCoincidence<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    alias: string,
    campo: string,
    termino: string,
  ): SelectQueryBuilder<T> {
    return query.andWhere(
      `LOWER(${alias}.${campo}) COLLATE utf8mb4_bin LIKE CONCAT('%', LOWER(:termino), '%') COLLATE utf8mb4_bin`,
      { termino },
    );
  }
}

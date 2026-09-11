export interface ISuperLineaSearchQuery {
  denominacion: string;
  skip: number;
  take: number;
  incluirEliminados: boolean;
}
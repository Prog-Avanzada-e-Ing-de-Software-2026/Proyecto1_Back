// domain/services/producto-intrinsic-validation.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import {
  fitsMoneyRange,
  fitsPercentageRange,
  fitsQuantityRange,
  isFiniteNumber,
  isPositiveInteger,
} from '../../../common/validation/numeric-rules';

interface ProductoIntrinsicState {
  denominacion: unknown;
  marcaId: unknown;
  lineaId: unknown;
  presentacionId: unknown;
  costo?: unknown;
  porcentaje?: unknown;
  stock?: unknown;
  stockMinimo?: unknown;
  utilizaStockMinimo?: unknown;
  utilizaPack?: unknown;
  cantidadPorPack?: unknown;
  alicuotaIva?: unknown;
  precioMayorista?: unknown;
  precioCliente?: unknown;
  precioOcasional?: unknown;
}

@Injectable()
export class ProductoIntrinsicValidationService {
  /**
   * Valida todos los datos intrínsecos del producto.
   *
   * Cuando `opciones.requerirEstadoCompleto` es `true`, exige la presencia de
   * `costo`, `porcentaje`, `stock` y `stockMinimo` y aplica las reglas de signo
   * aprobadas. Esto refleja el contrato de escritura completo de Producto (crear
   * y reemplazo total en actualización).
   */
  validarDatosBasicos(
    datos: ProductoIntrinsicState,
    opciones: { requerirEstadoCompleto?: boolean } = {},
  ): void {
    const { requerirEstadoCompleto = false } = opciones;

    this.validarDenominacion(datos.denominacion);
    this.validarIds(datos.marcaId, datos.lineaId, datos.presentacionId);
    this.validarPrecios(
      datos.precioMayorista,
      datos.precioCliente,
      datos.precioOcasional,
    );

    if (datos.alicuotaIva !== undefined) {
      this.validarAlicuotaIva(datos.alicuotaIva);
    }

    this.validarCosto(datos.costo, requerirEstadoCompleto);
    this.validarPorcentaje(datos.porcentaje, requerirEstadoCompleto);
    this.validarStock(datos.stock, requerirEstadoCompleto);
    this.validarStockMinimo(datos.stockMinimo, requerirEstadoCompleto);
    this.validarPack(datos.utilizaPack, datos.cantidadPorPack);
  }

  private validarDenominacion(denominacion: unknown): void {
    if (typeof denominacion !== 'string' || denominacion.trim().length === 0) {
      throw new BadRequestException('La denominación es obligatoria');
    }
    if (denominacion.length > 200) {
      throw new BadRequestException(
        'La denominación no puede superar 200 caracteres',
      );
    }
  }

  private validarIds(
    marcaId: unknown,
    lineaId: unknown,
    presentacionId: unknown,
  ): void {
    if (!isPositiveInteger(marcaId)) {
      throw new BadRequestException('Marca ID es requerido y debe ser válido');
    }
    if (!isPositiveInteger(lineaId)) {
      throw new BadRequestException('Línea ID es requerido y debe ser válido');
    }
    if (!isPositiveInteger(presentacionId)) {
      throw new BadRequestException(
        'Presentación ID es requerido y debe ser válido',
      );
    }
  }

  /**
   * Valida la jerarquía de precios: Mayorista <= Cliente <= Ocasional
   */
  private validarPrecios(
    precioMayorista?: unknown,
    precioCliente?: unknown,
    precioOcasional?: unknown,
  ): void {
    const pm = this.validarPrecioOpcional(precioMayorista, 'precio mayorista');
    const pc = this.validarPrecioOpcional(precioCliente, 'precio cliente');
    const po = this.validarPrecioOpcional(precioOcasional, 'precio ocasional');

    // Validar jerarquía: Mayorista <= Cliente <= Ocasional
    if (pm !== undefined && pc !== undefined && pm > pc) {
      throw new BadRequestException(
        'El precio Mayorista no puede superar el precio Cliente',
      );
    }

    if (pc !== undefined && po !== undefined && pc > po) {
      throw new BadRequestException(
        'El precio Cliente no puede superar el precio Ocasional',
      );
    }

    if (pm !== undefined && po !== undefined && pm > po) {
      throw new BadRequestException(
        'El precio Mayorista no puede superar el precio Ocasional',
      );
    }
  }

  private validarPrecioOpcional(
    valor: unknown,
    nombre: string,
  ): number | undefined {
    if (valor === undefined) {
      return undefined;
    }
    if (!isFiniteNumber(valor) || valor < 0) {
      throw new BadRequestException(
        `El ${nombre} no puede ser negativo`,
      );
    }
    return valor;
  }

  private validarAlicuotaIva(alicuotaIva: unknown): void {
    if (!isFiniteNumber(alicuotaIva) || alicuotaIva < 0 || alicuotaIva > 100) {
      throw new BadRequestException(
        'La alícuota IVA debe estar entre 0 y 100',
      );
    }
  }

  private validarCosto(costo: unknown, requerido: boolean): void {
    if (costo === undefined || costo === null) {
      if (requerido) {
        throw new BadRequestException('El costo es requerido');
      }
      return;
    }
    if (!isFiniteNumber(costo)) {
      throw new BadRequestException('El costo debe ser un número finito');
    }
    if (costo < 0) {
      throw new BadRequestException('El costo debe ser mayor o igual a 0');
    }
    if (!fitsMoneyRange(costo)) {
      throw new BadRequestException(
        'El costo debe estar dentro del rango monetario permitido',
      );
    }
  }

  private validarPorcentaje(porcentaje: unknown, requerido: boolean): void {
    if (porcentaje === undefined || porcentaje === null) {
      if (requerido) {
        throw new BadRequestException('El margen es requerido');
      }
      return;
    }
    if (!isFiniteNumber(porcentaje)) {
      throw new BadRequestException('El margen debe ser un número finito');
    }
    if (porcentaje <= 0) {
      throw new BadRequestException('El margen debe ser mayor que 0');
    }
    if (!fitsPercentageRange(porcentaje)) {
      throw new BadRequestException(
        'El margen debe estar dentro del rango porcentual permitido',
      );
    }
  }

  private validarStock(stock: unknown, requerido: boolean): void {
    if (stock === undefined || stock === null) {
      if (requerido) {
        throw new BadRequestException('El stockActual es requerido');
      }
      return;
    }
    if (!isFiniteNumber(stock)) {
      throw new BadRequestException('El stockActual debe ser un número finito');
    }
    if (stock <= 0) {
      throw new BadRequestException('El stockActual debe ser mayor que 0');
    }
    if (!fitsQuantityRange(stock)) {
      throw new BadRequestException(
        'El stockActual debe estar dentro del rango de cantidad permitido',
      );
    }
  }

  private validarStockMinimo(stockMinimo: unknown, requerido: boolean): void {
    if (stockMinimo === undefined || stockMinimo === null) {
      if (requerido) {
        throw new BadRequestException('El stockMínimo es requerido');
      }
      return;
    }
    if (!isFiniteNumber(stockMinimo)) {
      throw new BadRequestException(
        'El stockMínimo debe ser un número finito',
      );
    }
    if (stockMinimo <= 0) {
      throw new BadRequestException('El stockMínimo debe ser mayor que 0');
    }
    if (!fitsQuantityRange(stockMinimo)) {
      throw new BadRequestException(
        'El stockMínimo debe estar dentro del rango de cantidad permitido',
      );
    }
  }

  private validarPack(
    utilizaPack: unknown,
    cantidadPorPack: unknown,
  ): void {
    if (utilizaPack === true) {
      if (!isPositiveInteger(cantidadPorPack)) {
        throw new BadRequestException(
          'La cantidad por pack debe ser un número entero positivo.',
        );
      }
      return;
    }

    if (cantidadPorPack !== undefined && !isPositiveInteger(cantidadPorPack)) {
      throw new BadRequestException(
        'La cantidad por pack debe ser un número entero positivo.',
      );
    }
  }
}

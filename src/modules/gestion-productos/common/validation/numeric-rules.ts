export const MONEY_MAX = 9_999_999_999.999_99;
export const MONEY_SCALE = 5;
export const QUANTITY_MAX = 999_999_999.999;
export const QUANTITY_SCALE = 3;
export const PERCENTAGE_MAX = 999.99;
export const PERCENTAGE_SCALE = 2;

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isPositiveInteger(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value > 0;
}

export function isNonNegativeInteger(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0;
}

export function hasMaxScale(value: number, scale: number): boolean {
  if (!isFiniteNumber(value)) return false;
  const scaled = value * 10 ** scale;
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
}

export function fitsMoneyRange(value: unknown): boolean {
  return (
    isFiniteNumber(value) &&
    value >= 0 &&
    value <= MONEY_MAX &&
    hasMaxScale(value, MONEY_SCALE)
  );
}

export function fitsQuantityRange(value: unknown): boolean {
  return (
    isFiniteNumber(value) &&
    value >= 0 &&
    value <= QUANTITY_MAX &&
    hasMaxScale(value, QUANTITY_SCALE)
  );
}

export function fitsPercentageRange(value: unknown): boolean {
  return (
    isFiniteNumber(value) &&
    value >= 0 &&
    value <= PERCENTAGE_MAX &&
    hasMaxScale(value, PERCENTAGE_SCALE)
  );
}

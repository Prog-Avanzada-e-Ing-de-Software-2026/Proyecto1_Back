import {
  registerDecorator,
  ValidateIf,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export const MONEY_MAX = 9_999_999_999.999_99;
export const MONEY_SCALE = 5;
export const QUANTITY_MAX = 999_999_999.999;
export const QUANTITY_SCALE = 3;
export const PERCENTAGE_MAX = 999.99;
export const PERCENTAGE_SCALE = 2;

export function normalizeString(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.trim().toLowerCase();
  }
  return value;
}

export function toStrictBoolean(value: unknown): unknown {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

export function toQueryNumber(value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return value;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) || !Number.isFinite(parsed) ? value : parsed;
  }
  return value;
}

export function toQueryDate(value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? value : value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || Number.isNaN(value)) return value;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return value;
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? value : date;
  }
  return value;
}

export function IsOptionalWhenUndefined(): PropertyDecorator {
  return ValidateIf((_, value) => value !== undefined);
}

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
  const multiplier = 10 ** scale;
  const scaled = value * multiplier;
  return Number.isInteger(scaled);
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

type Predicate = (value: unknown) => boolean;

function createConstraintDecorator(
  name: string,
  predicate: Predicate,
  defaultMessage: (args: ValidationArguments) => string,
): (validationOptions?: ValidationOptions) => PropertyDecorator {
  return function (validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: object, propertyName: string) {
      registerDecorator({
        name,
        target: object.constructor,
        propertyName,
        options: validationOptions,
        validator: {
          validate(value: unknown) {
            return predicate(value);
          },
          defaultMessage(args: ValidationArguments) {
            return validationOptions?.message?.toString() ?? defaultMessage(args);
          },
        },
      });
    };
  };
}

function buildDecimalMessage(property: string, max: number, scale: number): string {
  return `El campo ${property} debe estar entre 0 y ${max} con hasta ${scale} decimales.`;
}

export const IsMoney = createConstraintDecorator(
  'isMoney',
  fitsMoneyRange,
  (args) => buildDecimalMessage(args.property, MONEY_MAX, MONEY_SCALE),
);

export const IsQuantity = createConstraintDecorator(
  'isQuantity',
  fitsQuantityRange,
  (args) => buildDecimalMessage(args.property, QUANTITY_MAX, QUANTITY_SCALE),
);

export const IsPercentage = createConstraintDecorator(
  'isPercentage',
  fitsPercentageRange,
  (args) => buildDecimalMessage(args.property, PERCENTAGE_MAX, PERCENTAGE_SCALE),
);

export const IsPositiveInteger = createConstraintDecorator(
  'isPositiveInteger',
  isPositiveInteger,
  (args) => `El campo ${args.property} debe ser un número entero positivo.`,
);

import {
  registerDecorator,
  ValidateIf,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import {
  fitsMoneyRange,
  fitsPercentageRange,
  fitsQuantityRange,
  isPositiveInteger,
  MONEY_MAX,
  MONEY_SCALE,
  PERCENTAGE_MAX,
  PERCENTAGE_SCALE,
  QUANTITY_MAX,
  QUANTITY_SCALE,
} from './numeric-rules';

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
            return (
              validationOptions?.message?.toString() ?? defaultMessage(args)
            );
          },
        },
      });
    };
  };
}

function buildDecimalMessage(
  property: string,
  max: number,
  scale: number,
): string {
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
  (args) =>
    buildDecimalMessage(args.property, PERCENTAGE_MAX, PERCENTAGE_SCALE),
);

export const IsPositiveInteger = createConstraintDecorator(
  'isPositiveInteger',
  isPositiveInteger,
  (args) => `El campo ${args.property} debe ser un número entero positivo.`,
);

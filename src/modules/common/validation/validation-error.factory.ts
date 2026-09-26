import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export interface FieldValidationError {
  field: string;
  messages: string[];
}

export class RequestValidationException extends BadRequestException {
  constructor(public readonly fieldErrors: FieldValidationError[]) {
    super('Bad Request Exception');
  }
}

const RESERVED_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);
const SAFE_IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
const NUMERIC_INDEX = /^\d+$/;

function isSafeSegment(segment: string): boolean {
  if (segment.length === 0) {
    return false;
  }

  if (RESERVED_SEGMENTS.has(segment)) {
    return false;
  }

  if (NUMERIC_INDEX.test(segment)) {
    return true;
  }

  return SAFE_IDENTIFIER.test(segment);
}

function buildFieldPath(prefix: string, segment: string): string {
  if (NUMERIC_INDEX.test(segment)) {
    return `${prefix}[${segment}]`;
  }

  if (prefix.length === 0) {
    return segment;
  }

  return `${prefix}.${segment}`;
}

function collectFieldErrors(
  errors: ValidationError[],
  prefix: string,
  accumulator: FieldValidationError[],
): void {
  for (const error of errors) {
    if (typeof error !== 'object' || error === null) {
      continue;
    }

    const segment = String(error.property ?? '');
    if (!isSafeSegment(segment)) {
      continue;
    }

    const fieldPath = buildFieldPath(prefix, segment);

    if (error.constraints && typeof error.constraints === 'object') {
      const constraintEntries = Object.entries(error.constraints)
        .filter(
          ([key, message]) =>
            typeof key === 'string' &&
            key.length > 0 &&
            typeof message === 'string',
        )
        .sort(([a], [b]) => a.localeCompare(b));

      const seenMessages = new Set<string>();
      const messages: string[] = [];

      for (const [, message] of constraintEntries) {
        if (!seenMessages.has(message)) {
          seenMessages.add(message);
          messages.push(message);
        }
      }

      if (messages.length > 0) {
        accumulator.push({ field: fieldPath, messages });
      }
    }

    if (Array.isArray(error.children)) {
      collectFieldErrors(error.children, fieldPath, accumulator);
    }
  }
}

export function normalizeValidationErrors(
  errors: ValidationError[],
): FieldValidationError[] {
  const accumulator: FieldValidationError[] = [];
  collectFieldErrors(errors, '', accumulator);

  return accumulator
    .sort((a, b) => a.field.localeCompare(b.field))
    .reduce<FieldValidationError[]>((deduplicated, current) => {
      const existing = deduplicated.find((entry) => entry.field === current.field);
      if (existing) {
        const seen = new Set(existing.messages);
        for (const message of current.messages) {
          if (!seen.has(message)) {
            seen.add(message);
            existing.messages.push(message);
          }
        }
      } else {
        deduplicated.push({ ...current });
      }
      return deduplicated;
    }, []);
}

export function createRequestValidationException(
  errors: ValidationError[],
): RequestValidationException {
  return new RequestValidationException(normalizeValidationErrors(errors));
}

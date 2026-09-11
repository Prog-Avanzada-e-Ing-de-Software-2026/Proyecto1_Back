import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Inject, Injectable } from '@nestjs/common';
import {
  ISuperLineaRepository
} from 'src/modules/gestion-productos/superlinea/domain/interfaces/superlinea.repository.interface';
import { Not } from 'typeorm';

@ValidatorConstraint({ name: 'UniqueDenominaciónValidator', async: true })
@Injectable()
export class IsUniqueDenominacionConstraint
  implements ValidatorConstraintInterface
{
  constructor(
    @Inject('ISuperLineaRepository')
    private readonly superLineaRepository: ISuperLineaRepository,
  ) {}

  async validate(value: string, args: ValidationArguments): Promise<boolean> {
    if (!value) return true;
    const ignoreIdField =
      (args.constraints?.[0]?.ignoreIdField as string) || 'id';
    const ignoreId = (args.object as any)?.[ignoreIdField];
    const where: any = { denominacion: value };
    if (ignoreId) where.id = Not(ignoreId);
    const exists =
      await this.superLineaRepository.findByDenominacionWithDeleted(value);

    return !exists;
  }

  defaultMessage(): string {
    return 'La denominación ya existe';
  }
}

export function IsUniqueDenominacion(options?: { ignoreIdField?: string }, validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [options || {}],
      validator: IsUniqueDenominacionConstraint,
    });
  };
}
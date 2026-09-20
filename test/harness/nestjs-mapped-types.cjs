const { Logger } = require('@nestjs/common');

const logger = new Logger('MappedTypesTestHarness');

function applyIsOptionalDecorator(targetClass, propertyKey) {
  require('class-validator').IsOptional()(targetClass.prototype, propertyKey);
}

function applyValidateIfDefinedDecorator(targetClass, propertyKey) {
  require('class-validator').ValidateIf((_, value) => value !== undefined)(
    targetClass.prototype,
    propertyKey,
  );
}

function inheritValidationMetadata(parentClass, targetClass, isPropertyInherited) {
  try {
    const classValidator = require('class-validator');
    const metadataStorage = classValidator.getMetadataStorage
      ? classValidator.getMetadataStorage()
      : classValidator.getFromContainer(classValidator.MetadataStorage);
    const metadata = metadataStorage.getTargetValidationMetadatas(
      parentClass,
      null,
      false,
      false,
    );

    return metadata
      .filter(
        ({ propertyName }) =>
          !isPropertyInherited || isPropertyInherited(propertyName),
      )
      .map((entry) => {
        const originalType = Reflect.getMetadata(
          'design:type',
          parentClass.prototype,
          entry.propertyName,
        );
        if (originalType) {
          Reflect.defineMetadata(
            'design:type',
            originalType,
            targetClass.prototype,
            entry.propertyName,
          );
        }
        metadataStorage.addValidationMetadata({ ...entry, target: targetClass });
        return entry.propertyName;
      });
  } catch (error) {
    logger.error(
      `Validation metadata cannot be inherited for "${parentClass.name}".`,
      error,
    );
  }
}

function inheritTransformationMetadata(
  parentClass,
  targetClass,
  isPropertyInherited,
  stackDecorators = true,
) {
  try {
    const { defaultMetadataStorage } = require('class-transformer/cjs/storage');
    const metadataKeys = [
      '_excludeMetadatas',
      '_exposeMetadatas',
      '_transformMetadatas',
      '_typeMetadatas',
    ];

    for (const metadataKey of metadataKeys) {
      let currentParent = parentClass;
      while (currentParent && currentParent !== Object) {
        const metadataMap = defaultMetadataStorage[metadataKey];
        if (metadataMap.has(currentParent)) {
          const inheritedEntries = Array.from(
            metadataMap.get(currentParent).entries(),
          )
            .filter(
              ([propertyKey]) =>
                !isPropertyInherited || isPropertyInherited(propertyKey),
            )
            .map(([propertyKey, metadata]) => [
              propertyKey,
              Array.isArray(metadata)
                ? metadata.map((entry) => ({ ...entry, target: targetClass }))
                : { ...metadata, target: targetClass },
            ]);

          const targetEntries = metadataMap.has(targetClass)
            ? metadataMap.get(targetClass).entries()
            : [];
          const merged = new Map();
          for (const entries of [targetEntries, inheritedEntries]) {
            for (const [propertyKey, metadata] of entries) {
              if (
                stackDecorators &&
                merged.has(propertyKey) &&
                Array.isArray(merged.get(propertyKey))
              ) {
                merged
                  .get(propertyKey)
                  .push(...(Array.isArray(metadata) ? metadata : [metadata]));
              } else {
                merged.set(propertyKey, metadata);
              }
            }
          }
          metadataMap.set(targetClass, merged);
        }
        currentParent = Object.getPrototypeOf(currentParent);
      }
    }
  } catch (error) {
    logger.error(
      `Transformation metadata cannot be inherited for "${parentClass.name}".`,
      error,
    );
  }
}

function inheritPropertyInitializers(
  target,
  sourceClass,
  isPropertyInherited = () => true,
) {
  try {
    const source = new sourceClass();
    Object.getOwnPropertyNames(source)
      .filter(
        (propertyName) =>
          source[propertyName] !== undefined &&
          target[propertyName] === undefined &&
          isPropertyInherited(propertyName),
      )
      .forEach((propertyName) => {
        target[propertyName] = source[propertyName];
      });
  } catch {}
}

function PartialType(classRef, options = {}) {
  class PartialClass {
    constructor() {
      inheritPropertyInitializers(this, classRef);
    }
  }

  const propertyKeys = inheritValidationMetadata(classRef, PartialClass) || [];
  inheritTransformationMetadata(classRef, PartialClass);
  const applyPartial =
    options.skipNullProperties === false
      ? applyValidateIfDefinedDecorator
      : applyIsOptionalDecorator;
  propertyKeys.forEach((propertyKey) => applyPartial(PartialClass, propertyKey));
  Object.defineProperty(PartialClass, 'name', {
    value: `Partial${classRef.name}`,
  });
  return PartialClass;
}

function OmitType(classRef, keys) {
  const inherited = (propertyKey) => !keys.includes(propertyKey);
  class OmitClass {
    constructor() {
      inheritPropertyInitializers(this, classRef, inherited);
    }
  }

  inheritValidationMetadata(classRef, OmitClass, inherited);
  inheritTransformationMetadata(classRef, OmitClass, inherited);
  Object.defineProperty(OmitClass, 'name', { value: `Omit${classRef.name}` });
  return OmitClass;
}

module.exports = {
  PartialType,
  OmitType,
  applyIsOptionalDecorator,
  applyValidateIfDefinedDecorator,
  inheritPropertyInitializers,
  inheritTransformationMetadata,
  inheritValidationMetadata,
};

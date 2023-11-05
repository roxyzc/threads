import validator from 'validator';
import {
  ValidationOptions,
  registerDecorator,
  ValidationArguments,
} from 'class-validator';

export function isAlphanumericAndSpace(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsAlphanumericAndSpace',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          if (
            value === undefined ||
            !validator.isAlphanumeric(validator.blacklist(value, ' ')) ||
            validator.trim(value).replace(/\s+/g, ' ') !== value
          ) {
            return false;
          }
          return true;
        },
        defaultMessage(validationArguments: ValidationArguments) {
          return (
            (validationArguments.object as any)[
              `${validationArguments.property}_error`
            ] ||
            `${propertyName} should only contain letters and numbers (a-z, A-Z, 0-9)`
          );
        },
      },
    });
  };
}

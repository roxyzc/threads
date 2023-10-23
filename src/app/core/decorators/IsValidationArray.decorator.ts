import {
  ValidationOptions,
  registerDecorator,
  ValidationArguments,
} from 'class-validator';
import validator from 'validator';

export function IsValidationArray(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsValidationArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: { name: string }) {
          let i = 0;

          if (value && value.name === undefined) {
            return false;
          }

          if (
            value.name !== undefined &&
            (!validator.isAlphanumeric(validator.blacklist(value.name, ' ')) ||
              validator.trim(value.name).replace(/\s+/g, ' ') !== value.name ||
              i > 5)
          ) {
            return false;
          }

          i = i + 1;
          return true;
        },
        defaultMessage(object: ValidationArguments) {
          return (
            (object.object as any)[`${object.property}_error`] ||
            `${propertyName} only a-z,A-Z,0-9`
          );
        },
      },
    });
  };
}

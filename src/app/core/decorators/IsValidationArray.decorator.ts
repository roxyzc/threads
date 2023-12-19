import {
  ValidationOptions,
  registerDecorator,
  ValidationArguments,
} from 'class-validator';
import { TagDto } from 'src/app/domain/content/dtos/tag.dto';
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
          if (value && value.name === undefined) {
            return false;
          }

          if (
            value.name !== undefined &&
            validator.trim(value.name).replace(/\s+/g, ' ') !== value.name
          ) {
            return false;
          }

          return true;
        },
        defaultMessage(object: ValidationArguments) {
          return (
            (object.object as any)[`${object.property}_error`] ||
            `${propertyName} don't use spaces twice on this value`
          );
        },
      },
    });
  };
}

export function IsUniqueTagName(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUniqueTagName',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: TagDto, args) {
          const tags: TagDto[] = args.object[propertyName];
          return tags.filter((tag) => tag.name === value.name).length <= 1;
        },
        defaultMessage(object: ValidationArguments) {
          return (
            (object.object as any)[`${object.property}_error`] ||
            `${propertyName} must unique`
          );
        },
      },
    });
  };
}

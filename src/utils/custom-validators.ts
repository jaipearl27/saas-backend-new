import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { ObjectId } from 'mongodb';

@ValidatorConstraint({ name: 'IsEnumOrObjectId', async: false })
export class IsEnumOrObjectId implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    const [enumObj] = args.constraints;

    // Check if the value is a valid enum
    const isEnumValid = Object.values(enumObj).includes(value);

    // Check if the value is a valid MongoDB ObjectId
    const isObjectIdValid = ObjectId.isValid(value);

    return isEnumValid || isObjectIdValid;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid enum value or a MongoDB ObjectId.`;
  }
}

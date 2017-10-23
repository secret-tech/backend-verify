import * as Joi from 'joi';
import { InvalidParametersException } from '../exceptions/exceptions';

export function validateObjectByJoiScheme(obj: any, scheme: Joi.Schema) {
  const result = Joi.validate(obj || {}, scheme, { allowUnknown: true });
  if (result.error) {
    throw new InvalidParametersException(result.error && result.error.message || result.error);
  }
}

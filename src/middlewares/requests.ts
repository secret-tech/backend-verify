import { responseWithError } from '../helpers/responses';
import * as Joi from 'joi';
import { Response, Request, NextFunction } from 'express';

const options = {
  allowUnknown: true
};

const jsonSchemeValidateRequest = Joi.object().keys({
  code: Joi.string().min(1).required()
});

function commonFlowRequestMiddleware(scheme: Joi.Schema, req: Request, res: Response, next: NextFunction) {
  const result = Joi.validate(req.body || {}, scheme, options);

  if (result.error) {
    return responseWithError(res, 422, {
      'error': result.error,
      'details': result.value
    });
  } else {
    return next();
  }
}

export function validateRequest(req: Request, res: Response, next: NextFunction) {
  return commonFlowRequestMiddleware(jsonSchemeValidateRequest, req, res, next);
}

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

export function initiateVerification(req: Request, res: Response, next: NextFunction) {
  let scheme;

  if (req.params.method === 'email') {
    scheme = Joi.object().keys({
      consumer: Joi.string().required().empty(),

      template: Joi.object({}),

      generateCode: Joi.when('policy.forcedCode', {
        is: null,
        then: Joi.object({
          length: Joi.number().greater(0).less(32).required(),
          symbolSet: Joi.array().items(Joi.string().empty()).required()
        })
      }),

      policy: Joi.object({
        expiredOn: Joi.string().required().empty(),
        forcedVerificationId: Joi.string().empty().guid(),
        forcedCode: Joi.string().empty()
      }).required()
    });
  }

  if (req.params.method === 'google_auth') {
    scheme = Joi.object().keys({
      consumer: Joi.string().required().empty(),
      issuer: Joi.string().required(),

      policy: Joi.object({
        expiredOn: Joi.string().required().empty(),
        forcedVerificationId: Joi.string().empty().guid()
      }).required()
    });
  }

  return commonFlowRequestMiddleware(scheme, req, res, next);
}

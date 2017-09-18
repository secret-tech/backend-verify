import { responseWithError } from '../helpers/responses'
import * as Joi from 'joi'
import { Response, Request, NextFunction } from 'express'

const options = {
  allowUnknown: true
}

const jsonSchemeInitiateRequest = Joi.object().keys({
  consumer: Joi.string().required(),

  template: Joi.object({
    body: Joi.string().required()
  }),

  generateCode: Joi.object({
    length: Joi.number().greater(0).less(32).required(),
    symbolSet: Joi.array().items(Joi.string()).required()
  }),

  policy: Joi.object({
    expiredOn: Joi.string(),
    forcedVerificationId: Joi.string(),
    forcedCode: Joi.string()
  }).required()
})

const jsonSchemeValidateRequest = Joi.object().keys({
  code: Joi.string().required()
})

function commonFlowRequestMiddleware(scheme: Joi.Schema, req: Request, res: Response, next: NextFunction) {
  const result = Joi.validate(req.body, scheme, options)

  if (result.error) {
    return responseWithError(res, 422, {
      'error': 'Invalid request',
      'details': result.value
    })
  } else {
    return next()
  }
}

export function initiateRequest(req: Request, res: Response, next: NextFunction) {
  return commonFlowRequestMiddleware(jsonSchemeInitiateRequest, req, res, next)
}

export function validateRequest(req: Request, res: Response, next: NextFunction) {
  return commonFlowRequestMiddleware(jsonSchemeValidateRequest, req, res, next)
}

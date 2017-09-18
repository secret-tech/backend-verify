import { Response, Request, NextFunction } from 'express'
import { inject, injectable } from 'inversify'

import { VerificationServiceFactory, VerificationServiceFactoryType } from '../services/verifications'

export const AuthMiddlewareType = Symbol('AuthMiddlewareType')
export const SupportedMethodsMiddlewareType = Symbol('SupportedMethodsMiddlewareType')

/**
 * Authentication middleware.
 */
@injectable()
export class AuthMiddleware {
  constructor() {
  }

  execute(req: Request, res: Response, next: NextFunction) {
    return next()
  }
}

/**
 * Filter only supported methods.
 */
@injectable()
export class SupportedMethodsMiddleware {
  constructor( @inject(VerificationServiceFactoryType) private verificationFactory: VerificationServiceFactory) {
  }

  execute(req: Request, res: Response, next: NextFunction) {
    if (!this.verificationFactory.hasMethod(req.params.method)) {
      return res.status(404).json({
        error: 'Method not supported'
      })
    }

    return next()
  }
}

import { Response, Request, NextFunction } from 'express'
import { inject, injectable } from 'inversify'

import { VerificationServiceFactory, VerificationServiceFactoryType } from '../services/verifications'
import { AuthenticationService, AuthenticationServiceType } from '../services/auth'
import { responseWithError } from '../helpers/responses'

export const AuthMiddlewareType = Symbol('AuthMiddlewareType')
export const SupportedMethodsMiddlewareType = Symbol('SupportedMethodsMiddlewareType')

class NotAuthorizedException extends Error { }

/**
 * Authentication middleware.
 */
@injectable()
export class AuthMiddleware {
  constructor( @inject(AuthenticationServiceType) private authenticationService: AuthenticationService) {
  }

  /**
   * Execute authentication
   *
   * @param req Request
   * @param res Response
   * @param next NextFunction
   */
  async execute(req: Request, res: Response, next: NextFunction) {
    try {
      const jwtToken = this.extractJwtFromRequstHeaders(req)
      if (!jwtToken || !await this.authenticationService.validate(jwtToken)) {
        return responseWithError(res, 401, { error: 'Not Authorized' })
      }
      return next()
    } catch (error) {
      return responseWithError(res, 500, { error })
    }
  }

  private extractJwtFromRequstHeaders(req: Request): string | null {
    if (!req.headers.authorization) {
      return null
    }

    const parts = req.headers.authorization.split(' ')

    if (parts[0] !== 'Bearer' || !parts[1]) {
      return null
    }

    return parts[1]
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
      return responseWithError(res, 404, 'Method not supported')
    }

    return next()
  }
}

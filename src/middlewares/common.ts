import { Response, Request, NextFunction } from 'express'
import { inject, injectable } from 'inversify'

import { VerificationServiceFactory, VerificationServiceFactoryType } from '../services/verifications'
import { AuthenticationService, AuthenticationServiceType, NotAuthorizedException } from '../services/auth'

export const AuthMiddlewareType = Symbol('AuthMiddlewareType')
export const SupportedMethodsMiddlewareType = Symbol('SupportedMethodsMiddlewareType')

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
      await this.authenticationService.validate(this.extractJwtFromRequst(req))
      return next()
    } catch (err) {
      if (err instanceof NotAuthorizedException) {
        return res.status(401).json({
          error: 'Not Authorized'
        })
      } else {
        return res.status(500).json({
          error: err
        })
      }
    }
  }

  /**
   * Extract jwt token from header
   * @param req Requst
   */
  private extractJwtFromRequst(req: Request): string {
    if (!req.headers.authorization) {
      throw new NotAuthorizedException()
    }

    const parts = req.headers.authorization.split(' ')

    if (parts[0] !== 'Bearer' || !parts[1]) {
      throw new NotAuthorizedException()
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
      return res.status(404).json({
        error: 'Method not supported'
      })
    }

    return next()
  }
}

import { Response, Request, NextFunction } from 'express';
import { inject, injectable } from 'inversify';

import { VerificationServiceFactory, VerificationServiceFactoryType } from '../services/verifications';
import { AuthenticationService, AuthenticationServiceType, AuthenticationException } from '../services/auth';
import { responseWithError } from '../helpers/responses';
export const AuthMiddlewareType = Symbol('AuthMiddlewareType');
export const SupportedMethodsMiddlewareType = Symbol('SupportedMethodsMiddlewareType');

export interface AuthorizedRequest extends Request {
  tenant?: TenantVerificationResult;
}

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
  async execute(req: AuthorizedRequest, res: Response, next: NextFunction) {
    try {
      const jwtToken = this.extractJwtFromRequestHeaders(req);
      const tenantData = await this.authenticationService.validate(jwtToken);
      if (!jwtToken || !tenantData) {
        return responseWithError(res, 401, { error: 'Not Authorized' });
      }

      req.tenant = tenantData;
      return next();
    } catch (error) {
      if (error instanceof AuthenticationException) {
        return responseWithError(res, 500, { error: error.message });
      }
      return responseWithError(res, 500, { error });
    }
  }

  private extractJwtFromRequestHeaders(req: Request): string | null {
    if (!req.headers.authorization) {
      return null;
    }

    const parts = req.headers.authorization.split(' ');

    if (parts[0] !== 'Bearer' || !parts[1]) {
      return null;
    }

    return parts[1];
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
      return responseWithError(res, 404, { error: 'Method not supported' });
    }

    return next();
  }
}

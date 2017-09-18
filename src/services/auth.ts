import { Response, Request, NextFunction } from 'express'
import { injectable, inject } from 'inversify'
import * as request from 'request'
import 'reflect-metadata'

export const AuthenticationServiceType = Symbol('AuthenticationServiceType')

export class AuthenticationException extends Error { }
export class NotAuthorizedException extends AuthenticationException { }

/**
 * AuthenticationService interface.
 */
export interface AuthenticationService {

  validate(jwtToken: string): Promise<boolean>

}

/**
 * ExternalHttpJwtAuthenticationService class
 */
@injectable()
export class ExternalHttpJwtAuthenticationService implements AuthenticationService {

  constructor() {
  }

  /**
   *
   * @param jwtToken
   */
  async validate(jwtToken: string): Promise<boolean> {
    if (!jwtToken) {
      return false
    }

    const result = await this.callValidateMethod(jwtToken)
    if (result instanceof Error) {
      return false
    }

    return result
  }

  /**
   *
   * @param jwtToken
   */
  protected callValidateMethod(jwtToken: string): Promise<boolean | Error> {
    return new Promise<boolean>((resolve, reject) => {
      resolve(true)
    })
  }

}

/**
 * Simple AuthenticationService
 */
@injectable()
export class JwtTestableInlineAuthenticationService implements AuthenticationService {

  /**
   *
   * @param jwtToken
   */
  async validate(jwtToken: string): Promise<boolean> {
    if (jwtToken.length === 0) {
      return false
    }
    return true
  }

}

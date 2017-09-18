import * as LRU from 'lru-cache'
import { Response, Request, NextFunction } from 'express'
import { injectable, inject } from 'inversify'
import * as request from 'request'
import 'reflect-metadata'

import config from '../config'

export const AuthenticationServiceType = Symbol('AuthenticationServiceType')

export class AuthenticationException extends Error { }

/**
 * AuthenticationService interface
 */
export interface AuthenticationService {

  validate(jwtToken: string): Promise<boolean>

}

/**
 * ExternalHttpJwtAuthenticationService class
 */
@injectable()
export class ExternalHttpJwtAuthenticationService implements AuthenticationService {

  private apiUrl: string = config.auth.url

  constructor() {
  }

  /**
   * Validate JWT token
   * @param jwtToken
   */
  async validate(jwtToken: string): Promise<boolean> {
    if (!jwtToken) {
      return false
    }

    const result = await this.callVerifyJwtTokenMethodEndpoint(jwtToken)

    return result
  }

  /**
   * Make HTTP/HTTPS request
   * @param jwtToken
   */
  async private callVerifyJwtTokenMethodEndpoint(jwtToken: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      request.post({
        url: this.apiUrl,
        headers: {
          'accept': 'application/json',
        },
        json: {token: jwtToken}
        // agentOptions: {
        //   cert: '',
        //   key: '',
        //   passphrase: '',
        //   securityOptions: 'SSL_OP_NO_SSLv3'
        // }
      }, (error: any, response: any, body: any) => {
        if (error) {
          reject(new Error(error))
        }

        if (response.status !== 200) {
          reject(new Error(body))
        } else {
          resolve(true)
        }
      })
    })
  }

}

/**
 * Simple, single value token validator
 * @internal
 */
@injectable()
export class JwtSingleInlineAuthenticationService implements AuthenticationService {

  private storedToken: string = 'TOKEN'

  /**
   * Set token
   * @param token
   */
  public setToken(token: string) {
    this.storedToken = token
  }

  /**
   * Validate JWT token
   * @param jwtToken
   */
  async validate(jwtToken: string): Promise<boolean> {
    if (jwtToken !== this.storedToken) {
      return false
    }
    return true
  }

}

/**
 * Cache decorator for only successfully request
 */
export class CachedAuthenticationDecorator implements AuthenticationService {
  private lruCache: any

  constructor(private authenticationService: AuthenticationService, maxAgeInSeconds: number = 30, maxLength: number = 1000) {
    this.lruCache = LRU({
      max: maxLength,
      maxAge: maxAgeInSeconds * 1000
    })
  }

  async validate(jwtToken: string): Promise<boolean> {
    try {
      if (this.lruCache.get(jwtToken)) {
        return true
      }
      if (await this.authenticationService.validate(jwtToken)) {
        this.lruCache.set(jwtToken, true)
        return true
      }
      return false
    } catch (err) {
      // @TODO: Add processing
      return false
    }
  }
}

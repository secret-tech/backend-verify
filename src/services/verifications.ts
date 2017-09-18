import { StorageService, StorageServiceType } from './storages';
import { injectable, inject } from 'inversify'
import * as uuid from 'node-uuid'
import 'reflect-metadata';

export const VerificationServiceFactoryType = Symbol('VerificationServiceFactoryType')

// Exceptions
export class VerificationException extends Error { }

export class NotFoundException extends VerificationException {
  constructor() {
    super('Not Found')
  }
}

export class InvalidParametersException extends VerificationException {
  constructor(public details: any) {
    super('Invalid request')
  }
}

/**
 * VerificationService interface.
 */
export interface VerificationService {

  initiate(params: any): Promise<any>
  validate(verificationId: string, params: any): Promise<boolean>
  remove(verificationId: string): Promise<boolean>

}

/**
 * VerificationServiceFactory interface.
 */
export interface VerificationServiceFactory {
  create(method: string): VerificationService
  hasMethod(method: string): boolean
}

/**
 * VerificationServiceFactory implementation.
 */
@injectable()
export class VerificationServiceFactoryRegister {
  constructor( @inject(StorageServiceType) private storageService: StorageService) {
  }

  create(method: string): VerificationService {
    return new EmailVerificationService('email', this.storageService)
  }

  hasMethod(method: string) {
    return method === 'email'
  }
}

/**
 * Concreate EmailVerificationService.
 */
export abstract class BaseVerificationService implements VerificationService {
  constructor(protected keyPrefix: string, protected storageService: StorageService) {
  }

  protected getAVerificationId(params: any): string {
    if (params.policy.verificationId) {
      // @TODO: Add validation with usage of Joi
      return params.policy.verificationId
    }
    return uuid.v4()
  }

  // @TODO: Rethink this weak algorithm, movout to helpers
  protected getACode(params: any): string {
    if (params.policy && params.policy.forceCode) {
      return params.policy.forceCode
    }

    const sourceSymbolSet = params.generateCode.symbolSet
    let codeLength = params.generateCode.length,
      symbolSet = '',
      code = ''

    symbolSet = sourceSymbolSet.map(element => {
      if (element === 'alphas') {
        return 'abcdefghijklmnopqrstuvwxyz'
      }
      if (element === 'ALPHAS') {
        return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      }
      if (element === 'DIGITS') {
        return '0123456789'
      }
      if (element === 'SYMBOLS') {
        return '!@#$%^&*-+=|<>()[]{};:_'
      }
      return element
    }).join('')

    while(codeLength--) {
      code += symbolSet[~~(Math.random() * symbolSet.length)]
    }

    return code
  }

  async initiate(params: any): Promise<any> {
    const TEMPORARY_HARDCODED_TTL = 60 * 60,
      verificationId = this.keyPrefix + this.getAVerificationId(params),
      result = await this.storageService
        .set(verificationId, { code: this.getACode(params) }, { ttlInSeconds: TEMPORARY_HARDCODED_TTL })

    return {
      verificationId: verificationId,
      expiredOn: ~~((+new Date + TEMPORARY_HARDCODED_TTL * 1000) / 1000)
    }
  }

  async validate(verificationId: string, params: any): Promise<boolean> {
    const result = await this.storageService.get(this.keyPrefix + verificationId, null)

    if (result === null) {
      throw new NotFoundException()
    }

    if (result.code === params.code) {
      await this.remove(verificationId)
      return true
    }

    return false
  }

  async remove(verificationId: string): Promise<boolean> {
    const result = await this.storageService.remove(this.keyPrefix + verificationId)
    return result !== null
  }
}

/**
 * Concreate EmailVerificationService.
 */
class EmailVerificationService extends BaseVerificationService {
  async initiate(params: any): Promise<any> {
    // @TODO: Send email here through provider
    return super.initiate(params)
  }
}

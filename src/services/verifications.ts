import { injectable, inject } from 'inversify';
import 'reflect-metadata';

import AuthenticatorVerificationService from './authenticator.verification';
import EmailVerificationService from './email.verification';
import { StorageServiceType } from './storages';
import { EmailProviderService, EmailProviderServiceType } from './providers/index';
import { InvalidParametersException } from '../exceptions/exceptions';

export const VerificationServiceFactoryType = Symbol('VerificationServiceFactoryType');

/**
 * VerificationServiceFactory interface.
 */
export interface VerificationServiceFactory {
  create(method: string): VerificationService;
  hasMethod(method: string): boolean;
}

const EMAIL_VERIFICATION_METHOD = 'email';
const AUTHENTICATOR_VERIFICATION_METHOD = 'google_auth';

/**
 * VerificationServiceFactory implementation.
 */
@injectable()
export class VerificationServiceFactoryRegister implements VerificationServiceFactory {
  constructor(
    @inject(StorageServiceType) private storageService: StorageService,
    @inject(EmailProviderServiceType) private emailProviderService: EmailProviderService
  ) { }

  /**
   * Create concrete verificator service
   *
   * @param method
   */
  create(method: string): VerificationService {
    switch (method) {
      case EMAIL_VERIFICATION_METHOD:
        return new EmailVerificationService(method, this.storageService, this.emailProviderService);
      case AUTHENTICATOR_VERIFICATION_METHOD:
        return new AuthenticatorVerificationService(method, this.storageService);
      default:
        throw new InvalidParametersException(`${method} not supported`);
    }
  }

  hasMethod(method: string): boolean {
    const allowedMethods = [
      EMAIL_VERIFICATION_METHOD,
      AUTHENTICATOR_VERIFICATION_METHOD
    ];

    return allowedMethods.indexOf(method) !== -1;
  }
}

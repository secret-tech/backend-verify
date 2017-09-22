import config from '../../config';
import * as emailProviders from './email';
import { injectable } from 'inversify';
import 'reflect-metadata';

// Exceptions
export class ProviderException extends Error { }
export class NotProperlyInitializedException extends ProviderException { }
export class InvalidParametersException extends ProviderException { }
export class NotFoundException extends ProviderException { }
export class InternalProviderException extends ProviderException { }

// Types

/**
 * Email Provider interface
 */
export interface EmailProvider {

  /**
   * Send an email
   *
   * @param sender
   * @param recipients
   * @param subject
   * @param text
   * @return Promise<any>
   */
  send(sender: string, recipients: Array<string>, subject: string, text: string): Promise<any>;
}

export const EmailProviderServiceType = Symbol('EmailProviderService');

/**
 * Email Providers service
 */
@injectable()
export class EmailProviderService {
  private emailRegistry: {
    [key: string]: EmailProvider
  } = {};

  /**
   * Get concrete email provider by name
   * @param name
   */
  public getEmailProviderByName(name: string): EmailProvider {
    return this.emailRegistry[name] || (
      this.emailRegistry[name] = this.findAndInstantiate(name, emailProviders)
    );
  }

  /**
   * Find by name provider
   * @param name
   */
  private findAndInstantiate(name: string, providers: any): EmailProvider {
    let providerName = Object.keys(providers).filter((providerClassName) => (
        providers[providerClassName] instanceof Object &&
        providers[providerClassName].hasOwnProperty('getName') &&
        providers[providerClassName].getName() === name
      ));

    if (providerName.length !== 1) {
      throw new NotFoundException(`${name} not found or it\'s duplicated`);
    }

    return new providers[providerName[0]](process.env);
  }
}

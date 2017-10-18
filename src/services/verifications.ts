import { injectable, inject } from 'inversify';
import * as crypto from 'crypto';
import * as moment from 'moment';
import * as uuid from 'node-uuid';
import 'reflect-metadata';

import { StorageService, StorageServiceType } from './storages';
import { EmailProviderService, EmailProviderServiceType, EmailProvider } from './providers/index';
import config from '../config';
import * as Joi from 'joi';

export const VerificationServiceFactoryType = Symbol('VerificationServiceFactoryType');

// Exceptions
export class VerificationException extends Error { }

export class NotFoundException extends VerificationException {
  constructor() {
    super('Not Found');
  }
}

export class InvalidParametersException extends VerificationException {
  constructor(public details: any) {
    super(details);
    this.name = 'Invalid request';
  }
}

// Types

/**
 * VerificationService interface.
 */
export interface VerificationService {

  initiate(params: any): Promise<any>;
  validate(verificationId: string, params: any): Promise<ValidationResult>;
  remove(verificationId: string): Promise<boolean>;

}

/**
 * VerificationServiceFactory interface.
 */
export interface VerificationServiceFactory {
  create(method: string): VerificationService;
  hasMethod(method: string): boolean;
}

const EMAIL_VERIFICATION_METHOD = 'email';

/**
 * VerificationServiceFactory implementation.
 */
@injectable()
export class VerificationServiceFactoryRegister {
  constructor(
    @inject(StorageServiceType) private storageService: StorageService,
    @inject(EmailProviderServiceType) private emailProviderService: EmailProviderService
  ) {
  }

  /**
   * Create concrete verificator service
   *
   * @param method
   */
  create(method: string): VerificationService {
    if (method !== EMAIL_VERIFICATION_METHOD) {
      throw new InvalidParametersException(`${method} not supported`);
    }

    return new EmailVerificationService(EMAIL_VERIFICATION_METHOD, this.storageService, this.emailProviderService);
  }

  /**
   * Check supported method
   * @param method
   */
  hasMethod(method: string) {
    return method && method.toLowerCase() === EMAIL_VERIFICATION_METHOD;
  }
}

// @TODO: Rethink, may be is too weak algorithm here
function generateCode(symbolSet: Array<string>, length: number) {
  let stringWithAllSymbols = '';
  let resultCode = '';

  stringWithAllSymbols = (symbolSet || []).map(element => {
    switch (element) {
      case 'alphas':
        return 'abcdefghijklmnopqrstuvwxyz'; // ~27%
      case 'ALPHAS':
        return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // ~27%
      case 'DIGITS':
        return '01234567890123456789'; // ~22% it's duplicated for uniform distribution
      case 'SYMBOLS':
        return '!@#$%^&*-+=|<>()[]{};:_'; // ~24%
      default:
        return element;
    }
  }).join('');

  while (length--) {
    resultCode += stringWithAllSymbols[crypto.randomBytes(1)[0] % stringWithAllSymbols.length];
  }

  return resultCode;
}

// Types

interface ParamsType {
  consumer: string;
  template?: any;
  generateCode?: GenerateCodeType;
  policy: PolicyParamsType;
}

interface PolicyParamsType {
  forcedVerificationId?: string;
  forcedCode?: string;
  expiredOn: number;
}

interface GenerateCodeType {
  symbolSet: Array<string>;
  length: number;
}

interface ValidationResult {
  isValid: boolean;
  verification?: {
    id: string,
    consumer: string,
    attempts: number,
    expiredOn: number
  };
}

const jsonSchemeInitiateRequest = Joi.object().keys({
  consumer: Joi.string().required().empty(),

  template: Joi.object({}),

  generateCode: Joi.object({}),

  policy: Joi.object({
    expiredOn: Joi.string().required().empty(),
    forcedVerificationId: Joi.string().empty().guid(),
    forcedCode: Joi.string().empty()
  }).required()
});

const jsonSchemeInitiateRequestGenerateCode = Joi.object().keys({
  length: Joi.number().greater(0).less(32).required(),
  symbolSet: Joi.array().items(Joi.string().empty()).required()
});

const jsonSchemeInitiateRequestEmailTemplate = Joi.object().keys({
  fromEmail: Joi.string().empty(),
  fromName: Joi.string().empty(),
  subject: Joi.string().empty(),
  body: Joi.string().empty().required()
});

function validateObjectByJoiScheme(obj: any, scheme: Joi.Schema) {
  const result = Joi.validate(obj || {}, scheme, { allowUnknown: true });
  if (result.error) {
    throw new InvalidParametersException(result.error && result.error.message || result.error);
  }
}

/**
 * Concrete EmailVerificationService
 */
export abstract class BaseVerificationService implements VerificationService {

  /**
   * Base constructor for verification service
   *
   * @param keyPrefix
   * @param storageService
   */
  constructor(protected keyPrefix: string, protected storageService: StorageService) {
  }

  /**
   * Get or generate verificationId
   *
   * @param policyParams
   */
  protected getVerificationId(policyParams: PolicyParamsType): string {
    if (policyParams.forcedVerificationId) {
      // @TODO: Add validation with usage of Joi
      return policyParams.forcedVerificationId;
    }

    return uuid.v4();
  }

  /**
   * Get or generate code
   *
   * @param generateParams
   * @param policyParams
   */
  protected getCode(generateParams: GenerateCodeType, policyParams: PolicyParamsType): string {
    if (policyParams && policyParams.forcedCode) {
      // @TODO: Add validation with usage of Joi
      return policyParams.forcedCode;
    }

    return generateCode(generateParams.symbolSet, generateParams.length);
  }

  /**
   * Initiate verification process
   *
   * @param params
   */
  async initiate(params: ParamsType): Promise<any> {

    validateObjectByJoiScheme(params, jsonSchemeInitiateRequest);

    if (typeof params.policy.forcedCode === 'undefined') {
      validateObjectByJoiScheme(params.generateCode, jsonSchemeInitiateRequestGenerateCode);
    }

    const verificationId = this.getVerificationId(params.policy);
    const code = this.getCode(params.generateCode, params.policy);
    const ttlInSeconds = moment.duration(params.policy.expiredOn).asSeconds();

    if (!ttlInSeconds) {
      throw new InvalidParametersException('expiredOn format is invalid');
    }

    const data = {
      verificationId,
      consumer: params.consumer,
      code,
      expiredOn: ~~((+new Date() + ttlInSeconds * 1000) / 1000)
    };

    await this.storageService.set(this.keyPrefix + verificationId, data, { ttlInSeconds });

    return data;
  }

  /**
   * Validate verificationId with passed code
   *
   * @param verificationId
   * @param params
   */
  async validate(verificationId: string, params: any): Promise<ValidationResult> {
    const result = await this.storageService.get(this.keyPrefix + verificationId, null);

    if (result === null) {
      throw new NotFoundException();
    }

    if (result.code === params.code) {
      await this.remove(verificationId);
      delete result.code;
      return {
        isValid: true,
        verification: result
      };
    }

    return {
      isValid: false
    };
  }

  /**
   * Remove verificationId
   *
   * @param verificationId
   */
  async remove(verificationId: string): Promise<boolean> {
    const result = await this.storageService.remove(this.keyPrefix + verificationId);
    return result !== null;
  }

}

interface EmailTemplateType {
  fromEmail: string;
  fromName?: string;
  subject: string;
  body: string;
}

const jsonSchemeInitiateRequestValidEmailConsumer = Joi.object().keys({
  consumer: Joi.string().email()
});

/**
 * Concrete EmailVerificationService.
 */
class EmailVerificationService extends BaseVerificationService {

  protected emailProvider: EmailProvider;

  /**
   * Email verification specialization
   *
   * @param keyPrefix
   * @param storageService
   * @param emailProviderService
   */
  constructor(protected keyPrefix: string, protected storageService: StorageService,
    protected emailProviderService: EmailProviderService
  ) {
    super(keyPrefix, storageService);

    if (!config.providers.email.provider) {
      throw new InvalidParametersException(`The environment variable MAIL_DRIVER isn\'t set up`);
    }

    this.emailProvider = emailProviderService.getEmailProviderByName(config.providers.email.provider);
  }

  /**
   * @inheritdoc
   */
  async initiate(params: ParamsType): Promise<any> {
    if (params.consumer) {
      validateObjectByJoiScheme(params, jsonSchemeInitiateRequestValidEmailConsumer);
    }
    validateObjectByJoiScheme(params.template, jsonSchemeInitiateRequestEmailTemplate);

    const templateParams: EmailTemplateType = params.template;
    let responseObject = await super.initiate(params);

    let emailFrom = templateParams.fromEmail || '';

    if (templateParams.fromName) {
      emailFrom = `${templateParams.fromName} <${emailFrom}>`;
    }

    // @TODO: The better solution is used external microservice for sending
    await this.emailProvider.send(
      emailFrom,
      [params.consumer],
      templateParams.subject || 'Verification Email',
      templateParams.body
        .replace(/{{{CODE}}}/g, responseObject.code)
        .replace(/{{{VERIFICATION_ID}}}/g, responseObject.verificationId)
    );

    // @TODO: Remove code in production environment
    // delete responseObject.code

    return responseObject;
  }

}

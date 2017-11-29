import * as moment from 'moment';
import * as uuid from 'node-uuid';
import { NotFoundException, InvalidParametersException } from '../exceptions/exceptions';
import * as crypto from 'crypto';

/**
 * BaseVerificationService
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

    if (generateParams) {
      return this.generateCode(generateParams.symbolSet, generateParams.length);
    }

    return '';
  }

  /**
   * Initiate verification process
   *
   * @param params
   * @param tenantData
   */
  async initiate(params: ParamsType, tenantData: TenantVerificationResult): Promise<any> {
    const verificationId = this.getVerificationId(params.policy);

    const code = this.getCode(params.generateCode, params.policy);

    const ttlInSeconds = moment.duration(params.policy.expiredOn).asSeconds();

    if (!ttlInSeconds) {
      throw new InvalidParametersException('expiredOn format is invalid');
    }

    const data = {
      verificationId,
      consumer: params.consumer,
      payload: params.payload,
      code,
      attempts: 0,
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
   * @param tenantData
   */
  async validate(verificationId: string, params: any, tenantData: TenantVerificationResult): Promise<ValidationResult> {
    const result = await this.getVerification(verificationId);

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

    result.attempts += 1;
    await this.storageService.set(this.keyPrefix + verificationId, result);

    delete result.code;
    return {
      isValid: false,
      verification: result
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

  async getVerification(verificationId: string): Promise<VerificationData> {
    return await this.storageService.get(this.keyPrefix + verificationId, null);
  }

  // @TODO: Rethink, may be is too weak algorithm here
  protected generateCode(symbolSet: Array<string>, length: number): string {
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
}

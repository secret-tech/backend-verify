import * as authenticator from 'authenticator';
import { NotFoundException } from '../exceptions/exceptions';
import { BaseVerificationService } from './base.verification';

export default class AuthenticatorVerificationService extends BaseVerificationService {
  async initiate(params: any, tenantData: TenantVerificationResult): Promise<any> {
    const result = await super.initiate(params, tenantData);

    let secret = await this.getSecret(params.consumer, tenantData.id);

    if (secret === null || !secret.verified) {
      secret = await this.generateAndStoreSecret(params.consumer, tenantData.id);
      result.totpUri = authenticator.generateTotpUri(secret.secret, params.consumer, params.issuer, 'SHA1', 6, 30);
    }
    return result;
  }

  async validate(verificationId: string, params: any, tenantData: TenantVerificationResult): Promise<ValidationResult> {
    const verification = await this.getVerification(verificationId);
    if (verification === null) {
      throw new NotFoundException('Verification is not found');
    }

    const secret = await this.getSecret(verification.consumer, tenantData.id);
    if (secret === null) {
      throw new NotFoundException('User secret is not found');
    }

    const result = authenticator.verifyToken(secret.secret, params.code.toString());
    if (!result) {
      verification.attempts += 1;
      await this.storageService.set(`${ this.keyPrefix }${ verificationId }`, verification);

      return {
        isValid: false,
        verification
      };
    }

    if (params.removeSecret === true) {
      await this.removeSecret(verification.consumer, tenantData.id);
    }

    if (!secret.verified) {
      await this.verifyAndSaveSecret(verification.consumer, tenantData.id, secret);
    }

    await this.storageService.remove(`${ this.keyPrefix }${ verificationId }`);
    return {
      isValid: true,
      verification
    };
  }

  private async generateAndStoreSecret(consumer: string, tenantId: string): Promise<AuthenticatorSecret> {
    const secret = {
      secret: authenticator.generateKey(),
      verified: false
    };
    await this.storageService.set(`${ this.keyPrefix + tenantId + consumer }`, secret);
    return secret;
  }

  private async verifyAndSaveSecret(consumer: string, tenantId: string, secret: AuthenticatorSecret): Promise<void > {
    secret.verified = true;
    await this.storageService.set(`${ this.keyPrefix + tenantId + consumer }`, secret);
  }

  private async getSecret(consumer: string, tenantId: string): Promise<AuthenticatorSecret> {
    return await this.storageService.get<AuthenticatorSecret>(`${ this.keyPrefix + tenantId + consumer }`, null);
  }

  private async removeSecret(consumer: string, tenantId: string): Promise<void> {
    await this.storageService.remove(`${ this.keyPrefix + tenantId + consumer }`);
  }
}

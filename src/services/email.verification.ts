import { EmailProviderService, EmailProvider } from './providers/index';
import { BaseVerificationService } from './base.verification';
import config from '../config';
import { InvalidParametersException } from '../exceptions/exceptions';
import * as Joi from 'joi';
import { validateObjectByJoiScheme } from './helpers';

export const jsonSchemeInitiateRequestValidEmailConsumer = Joi.object().keys({
  consumer: Joi.string().email()
});

export const jsonSchemeInitiateRequestEmailTemplate = Joi.object().keys({
  fromEmail: Joi.string().empty(),
  fromName: Joi.string().empty(),
  subject: Joi.string().empty(),
  body: Joi.string().empty().required()
});

/**
 * Concrete EmailVerificationService.
 */
export default class EmailVerificationService extends BaseVerificationService {

  protected emailProvider: EmailProvider;

  /**
   * Email verification specialization
   *
   * @param keyPrefix
   * @param storageService
   * @param emailProviderService
   */
  constructor(
    protected keyPrefix: string,
    protected storageService: StorageService,
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
  async initiate(params: ParamsType, tenantData: TenantVerificationResult): Promise<any> {
    if (params.consumer) {
      validateObjectByJoiScheme(params, jsonSchemeInitiateRequestValidEmailConsumer);
    }
    validateObjectByJoiScheme(params.template, jsonSchemeInitiateRequestEmailTemplate);

    const templateParams: EmailTemplateType = params.template;
    let responseObject = await super.initiate(params, tenantData);

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

    delete responseObject.code;

    return responseObject;
  }
}

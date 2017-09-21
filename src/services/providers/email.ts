import * as mailgun from 'mailgun-js';
import * as mailcomposer from 'mailcomposer';

import {
  EmailProvider,
  NotProperlyInitializedException,
  InvalidParametersException,
  InternalProviderException
} from './index';

/**
 * Dummy Email Provider class
 */
export class DummyEmailProvider implements EmailProvider {

  /**
   * Initiate concrete provider instance
   */
  constructor() {
  }

  /**
   * Get name of concrete provider
   */
  public static getName() {
    return 'dummy';
  }

  /**
   * @inheritdoc
   */
  public send(sender: string, recipients: Array<string>, subject: string, text: string): Promise<any> {
    console.log('SEND EMAIL HEAD: sender=%s recipients=%s subject=%s', sender, recipients, subject);
    console.log('SEND EMAIL BODY:', text);
    return Promise.resolve({sender, recipients, subject});
  }
}

/**
 * Mailgun Email Provider class
 */
export class MailgunEmailProvider implements EmailProvider {
  private api: any;

  /**
   * Initiate concrete provider instance
   */
  constructor(config: any) {
    const {
      MAILGUN_SECRET,
      MAILGUN_DOMAIN
    } = config;

    if (!MAILGUN_DOMAIN) {
      throw new NotProperlyInitializedException('MAILGUN_DOMAIN is invalid');
    }

    if (!MAILGUN_SECRET || !/^(api:)?key-.+/.test(MAILGUN_SECRET)) {
      throw new NotProperlyInitializedException('MAILGUN_SECRET is invalid');
    }

    this.api = this.createMailgunApi({
      apiKey: MAILGUN_SECRET,
      domain: MAILGUN_DOMAIN
    });
  }

  /**
   * Create instance for mailgun api
   * @param config
   */
  protected createMailgunApi(config: any) {
    return new mailgun(config);
  }

  /**
   * Get name of concrete provider
   */
  public static getName() {
    return 'mailgun';
  }

  /**
   * @inheritdoc
   */
  public send(sender: string, recipients: Array<string>, subject: string, text: string): Promise<any> {
    if (!recipients.length) {
      throw new InvalidParametersException();
    }

    /* istanbul ignore next */
    return new Promise((resolve, reject) => {
      let mail = mailcomposer({
        from: sender,
        to: recipients[0],
        subject,
        html: text
      });

      mail.build((mailBuildError, message) => {
        let dataToSend = {
          to: recipients[0],
          message: message.toString('ascii')
        };

        this.api.messages().sendMime(dataToSend, (err, body) => {
          if (err) {
            reject(new InternalProviderException(err));
          }
          resolve(body);
        });
      });
    });
  }
}

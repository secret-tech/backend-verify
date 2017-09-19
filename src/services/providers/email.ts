import * as mailgun from 'mailgun-js'
import * as mailcomposer from 'mailcomposer'

import {
  EmailProvider,
  NotProperlyInitializedException,
  InvalidParametersException,
  InternalProviderException
} from './index'

const {
  MAILGUN_API_KEY,
  MAILGUN_DOMAIN
} = process.env

/**
 * Mailgun Email Provider class
 */
export class EmailMailgunProvider implements EmailProvider {
  private api: any

  /**
   * Initiate concrete provicer instance
   */
  constructor() {
    if (!MAILGUN_DOMAIN) {
      throw new NotProperlyInitializedException('MAILGUN_DOMAIN is invalid')
    }

    if (!MAILGUN_API_KEY || !/^(api:)?key-.+/.test(MAILGUN_API_KEY)) {
      throw new NotProperlyInitializedException('MAILGUN_API_KEY is invalid')
    }

    this.api = new mailgun({
      apiKey: MAILGUN_API_KEY,
      domain: MAILGUN_DOMAIN
    })
  }

  /**
   * Get name of concrete provider
   */
  public static getName() {
    return 'mailgun'
  }

  /**
   * @inheritdoc
   */
  public send(sender: string, recipients: Array<string>, subject: string, text: string): Promise<any> {
    if (!recipients.length) {
      throw new InvalidParametersException()
    }

    return new Promise((resolve, reject) => {
      let mail = mailcomposer({
        from: sender,
        to: recipients[0],
        subject,
        html: text
      })

      mail.build((mailBuildError, message) => {
        let dataToSend = {
          to: recipients[0],
          message: message.toString('ascii')
        }

        this.api.messages().sendMime(dataToSend, (err, body) => {
          if (err) {
            reject(new InternalProviderException(err))
          }
          resolve(body)
        })
      })
    })
  }
}

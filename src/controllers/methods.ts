import { Request, Response } from 'express'
import { inject, injectable } from 'inversify'
import { controller, httpPost } from 'inversify-express-utils'
import 'reflect-metadata'

import {
  InvalidParametersException,
  VerificationServiceFactory,
  VerificationServiceFactoryType
} from '../services/verifications'

interface MethodRequest extends Request {
  params: {
    method: string;
  }
}

/**
 * MethodsController resource
 */
@injectable()
@controller(
  '/methods',
  'AuthMiddleware'
)
export class MethodsController {
  constructor( @inject(VerificationServiceFactoryType) private verificationFactory: VerificationServiceFactory) {
  }

  /**
   * Initiate verification process for specified method.
   *
   * @param  req  express req object
   * @param  res  express res object
   */
  @httpPost(
    '/:method/actions/initiate',
    'SupportedMethodsMiddleware'
  )
  async initiate(req: MethodRequest, res: Response): Promise<void> {
    try {
      const verificationService = this.verificationFactory.create(req.method)
      const verificationDetails = await verificationService.initiate(req.body)
      res.json(verificationDetails)
    } catch (err) {
      if (err instanceof InvalidParametersException) {
        res.status(422).send({
          'error': err.name,
          'details': err.details
        })
      } else {
        this.responseAsUnbehaviorError(res, err)
      }
    }
  }

  // @TODO: Moveout to helper
  private responseAsUnbehaviorError(res: Response, err: Error) {
    res.status(500).send({
      'error': err.name,
      'message': err.message
    })
  }
}

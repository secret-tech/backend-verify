import { Response } from 'express';
import { inject, injectable } from 'inversify';
import { controller, httpPost } from 'inversify-express-utils';
import 'reflect-metadata';
import { InvalidParametersException } from '../exceptions/exceptions';
import { responseWithError, responseAsUnbehaviorError } from '../helpers/responses';
import { AuthorizedRequest } from '../middlewares/common';

import {
  VerificationServiceFactory,
  VerificationServiceFactoryType
} from '../services/verifications';

interface MethodRequest extends AuthorizedRequest {
  params: {
    method: string;
  };
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
    'SupportedMethodsMiddleware',
    'InitiateVerificationValidation'
  )
  async initiate(req: MethodRequest, res: Response): Promise<void> {
    try {
      const verificationService = this.verificationFactory.create(req.params.method);
      const verificationDetails = await verificationService.initiate(req.body, req.tenant);
      res.json(Object.assign({}, verificationDetails, { status: 200 }));
    } catch (err) {
      if (err instanceof InvalidParametersException) {
        responseWithError(res, 422, {
          'error': err.name,
          'details': err.details
        });
      } else {
        responseAsUnbehaviorError(res, err);
      }
    }
  }

}

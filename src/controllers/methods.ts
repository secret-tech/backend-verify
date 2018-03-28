import { Response } from 'express';
import { inject, injectable } from 'inversify';
import { controller, httpPost } from 'inversify-express-utils';
import 'reflect-metadata';
import {InvalidParametersException, NotFoundException, TimeoutException} from '../exceptions/exceptions';
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

  /**
   * Initiate resend verification process for specified method.
   *
   * @param  req  express req object
   * @param  res  express res object
   */
  @httpPost(
    '/:method/actions/resend',
    'SupportedMethodsMiddleware',
    'InitiateVerificationValidation'
  )
  async resend(req: MethodRequest, res: Response): Promise<void> {
    try {
      if (req.params.method != 'email') {
        throw new InvalidParametersException(`${req.params.method} not supported`);
      }

      const verificationService = this.verificationFactory.create(req.params.method);
      const resendDetails = await verificationService.resend(req.body, req.tenant);
      res.json(Object.assign({}, resendDetails, { status: 200 }));
    } catch (err) {

      switch (err.constructor) {
        case InvalidParametersException:
          responseWithError(res, 422, {
            'error': err.name,
            'details': err.details
          });
          break;
        case TimeoutException:
          responseWithError(res, 403, {
            'error': err.name,
            'message': err.message
          });
          break;
        case NotFoundException:
          responseWithError(res, 404, {
            'error': err.name,
            'message': err.message
          });
          break;
        default:
          responseAsUnbehaviorError(res, err);
          break;
      }
    }
  }
}

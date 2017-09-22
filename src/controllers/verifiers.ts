import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { controller, httpDelete, httpPost } from 'inversify-express-utils';
import 'reflect-metadata';

import { responseWithError, responseAsUnbehaviorError } from '../helpers/responses';

import {
  NotFoundException,
  VerificationServiceFactory,
  VerificationServiceFactoryType
} from '../services/verifications';

interface VerifierRequest extends Request {
  params: {
    method: string;
    verificationId: string;
  };
}

/**
 * VerifiersController resource
 */
@injectable()
@controller(
  '/methods/:method/verifiers',
  'AuthMiddleware',
  'SupportedMethodsMiddleware'
)
export class VerifiersController {

  constructor( @inject(VerificationServiceFactoryType) private verificationFactory: VerificationServiceFactory) {
  }

  /**
   * Verify code for specified Verification Id.
   *
   * @param  req  express req object
   * @param  res  express res object
   */
  @httpPost(
    '/:verificationId/actions/validate'
  )
  async validate(req: VerifierRequest, res: Response): Promise<void> {
    try {
      const verificationService = this.verificationFactory.create(req.params.method);
      if (!await verificationService.validate(req.params.verificationId, req.body)) {
        responseWithError(res, 422, {
          'error': 'Invalid code'
        });
      } else {
        this.responseSuccessfully(res);
      }
    } catch (err) {
      if (err instanceof NotFoundException) {
        this.responseAsNotFound(res);
      } else {
        responseAsUnbehaviorError(res, err);
      }
    }
  }

  /**
   * Delete Verification Id.
   *
   * @param  req  express req object
   * @param  res  express res object
   */
  @httpDelete(
    '/:verificationId'
  )
  async remove(req: VerifierRequest, res: Response): Promise<void> {
    try {
      const verificationService = this.verificationFactory.create(req.params.method);
      if (!await verificationService.remove(req.params.verificationId)) {
        throw new NotFoundException();
      }
      this.responseSuccessfully(res);
    } catch (err) {
      if (err instanceof NotFoundException) {
        this.responseAsNotFound(res);
      } else {
        responseAsUnbehaviorError(res, err);
      }
    }
  }

  private responseSuccessfully(res: Response) {
    res.json({ status: 200 });
  }

  private responseAsNotFound(res: Response) {
    responseWithError(res, 404, {
      'error': 'Not found'
    });
  }
}

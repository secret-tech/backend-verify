import { Request, Response } from 'express'
import { inject, injectable } from 'inversify'
import { controller, httpDelete, httpPost } from 'inversify-express-utils'
import 'reflect-metadata';

import {
	NotFoundException,
	VerificationService,
	VerificationServiceFactory,
	VerificationServiceFactoryType,
} from '../services/verifications';


interface VerifierRequest extends Request {
	params: {
		method: string;
		verificationId: string;
	}
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
			const verificationService = this.verificationFactory.create(req.params.method)
			if (!await verificationService.validate(req.params.verificationId, req.body)) {
				res.status(422).send({
					'error': 'Invalid code'
				});
			} else {
				res.json({})
			}
		} catch (err) {
			if (err instanceof NotFoundException) {
				this.responseAsNotFound(res)
			} else {
				this.responseAsUnbehaviorError(res, err)
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
			// if (req.param('verificationId', null) === null) {
			// 	throw new NotFoundException();
			// }
			const verificationService = this.verificationFactory.create(req.params.method)
			await verificationService.remove(req.params.verificationId);
			res.json({})
		} catch (err) {
			if (err instanceof NotFoundException) {
				this.responseAsNotFound(res)
			} else {
				this.responseAsUnbehaviorError(res, err)
			}
		}
	}

	// @TODO: Moveout to helper
	private responseAsNotFound(res: Response) {
		res.status(404).send({
			'error': 'Not found'
		});
	}

	// @TODO: Moveout to helper
	private responseAsUnbehaviorError(res: Response, err: Error) {
		res.status(500).send({
			'error': err.name,
			'message': err.message
		});
	}
}

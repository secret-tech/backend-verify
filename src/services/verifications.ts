import { inject, injectable } from 'inversify'
import 'reflect-metadata';


export const VerificationServiceFactoryType = Symbol('VerificationServiceFactoryType')


// Exceptions
export class VerificationException extends Error { }

export class NotFoundException extends VerificationException {
	constructor() {
		super('Not Found')
	}
}

export class InvalidParametersException extends VerificationException {
	constructor(public details: any) {
		super('Invalid request')
	}
}


/**
 * VerificationService interface.
 */
export interface VerificationService {

	initiate(params: any): Promise<any>;
	validate(verificationId: string, params: any): Promise<boolean>;
	remove(verificationId: string): Promise<void>;

}


/**
 * VerificationServiceFactory interface.
 */
export interface VerificationServiceFactory {
	create(method: string): VerificationService;
	hasMethod(method: string): boolean;
}


/**
 * VerificationServiceFactory implementation.
 */
@injectable()
export class VerificationServiceFactoryRegister {
	constructor() {
	}

	create(method: string): VerificationService {
		return new EmailVerificationService();
	}

	hasMethod(method: string) {
		return method == 'email'
	}
}

/**
 * Concreate EmailVerificationService.
 */
abstract class BaseVerificationService implements VerificationService {
	constructor() {

	}

	async initiate(params: any): Promise<any> {
		return params;
	}

	async validate(verificationId: string, params: any): Promise<boolean> {
		return true;
	}

	async remove(verificationId: string): Promise<void> {
	}
}

/**
 * Concreate EmailVerificationService.
 */
class EmailVerificationService extends BaseVerificationService {
	async initiate(params: any): Promise<any> {
		return params;
	}
}

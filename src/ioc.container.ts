import { interfaces as InversifyInterfaces, Container } from 'inversify';
import * as express from 'express';
import config from './config';
import * as validation from './middlewares/requests';
import {
  RedisStorageService,
  SimpleInMemoryStorageService, StorageService,
  StorageServiceType
} from './services/storages';
import { EmailProviderService, EmailProviderServiceType } from './services/providers';
import {
  AuthenticationService,
  AuthenticationServiceType, CachedAuthenticationDecorator, ExternalHttpJwtAuthenticationService,
  JwtSingleInlineAuthenticationService
} from './services/auth';
import {
  AuthMiddleware,
  AuthMiddlewareType,
  SupportedMethodsMiddleware,
  SupportedMethodsMiddlewareType
} from './middlewares/common';
import {
  VerificationServiceFactory,
  VerificationServiceFactoryRegister,
  VerificationServiceFactoryType
} from './services/verifications';

import './controllers/methods';
import './controllers/verifiers';

let container = new Container();

// services
/* istanbul ignore else */
if (config.environment.isTesting) {
  container.bind<AuthenticationService>(AuthenticationServiceType)
    .to(JwtSingleInlineAuthenticationService);
} else {
  container.bind<AuthenticationService>(AuthenticationServiceType)
    .toDynamicValue((context: InversifyInterfaces.Context): AuthenticationService => {
      return new CachedAuthenticationDecorator(
        context.container.resolve(ExternalHttpJwtAuthenticationService)
      );
    }).inSingletonScope();
}

container.bind<EmailProviderService>(EmailProviderServiceType)
  .to(EmailProviderService).inSingletonScope();

/* istanbul ignore else */
if (config.environment.isTesting) {
  container.bind<StorageService>(StorageServiceType)
    .to(SimpleInMemoryStorageService).inSingletonScope();
} else {
  container.bind<StorageService>(StorageServiceType)
    .to(RedisStorageService).inSingletonScope();
}

container.bind<VerificationServiceFactory>(VerificationServiceFactoryType)
  .to(VerificationServiceFactoryRegister).inSingletonScope();

// middlewares
container.bind<AuthMiddleware>(AuthMiddlewareType)
  .to(AuthMiddleware);

container.bind<SupportedMethodsMiddleware>(SupportedMethodsMiddlewareType)
  .to(SupportedMethodsMiddleware);

const authMiddleware = container
  .get<AuthMiddleware>(AuthMiddlewareType);

/* istanbul ignore next */
container.bind<express.RequestHandler>('AuthMiddleware').toConstantValue(
  (req: any, res: any, next: any) => authMiddleware.execute(req, res, next)
);

const supportedMethodsMiddleware = container
  .get<SupportedMethodsMiddleware>(SupportedMethodsMiddlewareType);

/* istanbul ignore next */
container.bind<express.RequestHandler>('SupportedMethodsMiddleware').toConstantValue(
  (req: any, res: any, next: any) => supportedMethodsMiddleware.execute(req, res, next)
);

container.bind<express.RequestHandler>('InitiateVerificationValidation').toConstantValue(
  (req: any, res: any, next: any) => validation.initiateVerification(req, res, next)
);

export { container };

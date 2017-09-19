import { interfaces as InversifyInterfaces, Container } from 'inversify'
import { interfaces, TYPE } from 'inversify-express-utils'
import * as express from 'express'

import { MethodsController } from './controllers/methods'
import { VerifiersController } from './controllers/verifiers'

import * as commonMiddlewares from './middlewares/common'
import * as validationMiddlewares from './middlewares/requests'
import * as auths from './services/auth'
import * as storages from './services/storages'
import * as providers from './services/providers'
import * as verifications from './services/verifications'

let container = new Container()

// services
container.bind<auths.AuthenticationService>(auths.AuthenticationServiceType)
  .toDynamicValue((context: InversifyInterfaces.Context): auths.AuthenticationService => {
    return new auths.CachedAuthenticationDecorator(
      context.container.resolve(auths.ExternalHttpJwtAuthenticationService)
    )
  }).inSingletonScope()

container.bind<providers.EmailProviderService>(providers.EmailProviderServiceType)
  .to(providers.EmailProviderService).inSingletonScope()

container.bind<storages.StorageService>(storages.StorageServiceType)
  .to(storages.RedisStorageService).inSingletonScope()

container.bind<verifications.VerificationServiceFactory>(verifications.VerificationServiceFactoryType)
  .to(verifications.VerificationServiceFactoryRegister).inSingletonScope()

// middlewares
container.bind<commonMiddlewares.AuthMiddleware>(commonMiddlewares.AuthMiddlewareType)
  .to(commonMiddlewares.AuthMiddleware)

container.bind<commonMiddlewares.SupportedMethodsMiddleware>(commonMiddlewares.SupportedMethodsMiddlewareType)
  .to(commonMiddlewares.SupportedMethodsMiddleware)

const authMiddleware = container
  .get<commonMiddlewares.AuthMiddleware>(commonMiddlewares.AuthMiddlewareType)

container.bind<express.RequestHandler>('AuthMiddleware').toConstantValue(
  (req: any, res: any, next: any) => authMiddleware.execute(req, res, next)
)

const supportedMethodsMiddleware = container
  .get<commonMiddlewares.SupportedMethodsMiddleware>(commonMiddlewares.SupportedMethodsMiddlewareType)

container.bind<express.RequestHandler>('SupportedMethodsMiddleware').toConstantValue(
  (req: any, res: any, next: any) => supportedMethodsMiddleware.execute(req, res, next)
)

container.bind<express.RequestHandler>('MethodInitiateValidation').toConstantValue(
  (req: any, res: any, next: any) => validationMiddlewares.initiateRequest(req, res, next)
)

// controllers
container.bind<interfaces.Controller>(TYPE.Controller).to(MethodsController).whenTargetNamed('MethodsController')
container.bind<interfaces.Controller>(TYPE.Controller).to(VerifiersController).whenTargetNamed('VerifiersController')

export { container }

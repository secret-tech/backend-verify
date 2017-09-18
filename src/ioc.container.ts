import { Container } from 'inversify'
import { interfaces, TYPE } from 'inversify-express-utils'
import * as express from 'express'

import { MethodsController } from './controllers/methods'
import { VerifiersController } from './controllers/verifiers'

import * as commonMiddlewares from './middlewares/common'
import * as validationMiddlewares from './middlewares/requests'
import * as storages from './services/storages'
import * as verifications from './services/verifications'

let container = new Container()

// services
container.bind<storages.StorageService>(storages.StorageServiceType)
  .to(storages.SimpleInMemoryStorageService)

container.bind<verifications.VerificationServiceFactory>(verifications.VerificationServiceFactoryType)
  .to(verifications.VerificationServiceFactoryRegister)


// middlewares
container.bind<commonMiddlewares.AuthMiddleware>(commonMiddlewares.AuthMiddlewareType)
  .to(commonMiddlewares.AuthMiddleware)

container.bind<commonMiddlewares.SupportedMethodsMiddleware>(commonMiddlewares.SupportedMethodsMiddlewareType)
  .to(commonMiddlewares.SupportedMethodsMiddleware)

const authMiddleware = container.resolve(commonMiddlewares.AuthMiddleware)
container.bind<express.RequestHandler>('AuthMiddleware').toConstantValue(
  (req: any, res: any, next: any) => authMiddleware.execute(req, res, next)
)

const supportedMethodsMiddleware = container.resolve(commonMiddlewares.SupportedMethodsMiddleware)
container.bind<express.RequestHandler>('SupportedMethodsMiddleware').toConstantValue(
  (req: any, res: any, next: any) => supportedMethodsMiddleware.execute(req, res, next)
)

container.bind<express.RequestHandler>('MethodInitiateValidation').toConstantValue(
  (req: any, res: any, next: any) => validationMiddlewares.initiateRequest(req, res, next)
)

container.bind<express.RequestHandler>('MethodValidateValidation').toConstantValue(
  (req: any, res: any, next: any) => validationMiddlewares.validateRequest(req, res, next)
)

// controllers
container.bind<interfaces.Controller>(TYPE.Controller).to(MethodsController).whenTargetNamed('MethodsController')
container.bind<interfaces.Controller>(TYPE.Controller).to(VerifiersController).whenTargetNamed('VerifiersController')

export { container }

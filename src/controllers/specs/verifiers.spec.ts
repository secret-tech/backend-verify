import * as chai from 'chai';
import app from '../../server';
import * as express from 'express';
import * as TypeMoq from 'typemoq';
import { container } from '../../ioc.container';
import { InversifyExpressServer } from 'inversify-express-utils';
import * as bodyParser from 'body-parser';
import { VerificationServiceFactoryType, VerificationServiceFactory, VerificationServiceFactoryRegister } from '../../services/verifications';
import AuthenticatorVerificationService from '../../services/authenticator.verification';
import { SimpleInMemoryStorageService } from '../../services/storages';
import * as authenticator from 'authenticator';

chai.use(require('chai-http'));
const { expect, request } = chai;

function createRequest(path: string, data: any, method: string = 'post', customApp?: any) {
  const appToUse = customApp || app;

  return request(appToUse)[method](path)
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer TOKEN').send(data);
}

function createInitiateEmailVerification(verificationId: string, code: string) {
  return createRequest('/methods/email/actions/initiate', {
    consumer: 'test@test.com',
    template: {
      body: 'body'
    },
    policy: {
      expiredOn: '00:01:00',
      forcedCode: code,
      forcedVerificationId: verificationId
    },
    payload: {
      key: 'value'
    }
  });
}

function mockStorageForGoogleAuth(secret, verificationId, verificationData) {
  const customApp = express();

  const storageMock = TypeMoq.Mock.ofType(SimpleInMemoryStorageService);
  storageMock.setup(x => x.get(TypeMoq.It.isValue(`test${ verificationId }`), TypeMoq.It.isAny()))
    .returns(async(): Promise<any> => verificationData);

  storageMock.setup(x => x.get(TypeMoq.It.isValue('testtenantIdtest@test.com'), TypeMoq.It.isAny()))
    .returns(async(): Promise<any> => secret);

  const authenticatorService = new AuthenticatorVerificationService('test', storageMock.object);

  const factoryMock = TypeMoq.Mock.ofType(VerificationServiceFactoryRegister);

  factoryMock.setup(x => x.create(TypeMoq.It.isAny()))
    .returns(() => authenticatorService);

  container.rebind<VerificationServiceFactory>(VerificationServiceFactoryType).toConstantValue(factoryMock.object);

  customApp.use(bodyParser.json());
  customApp.use(bodyParser.urlencoded({ extended: false }));

  const server = new InversifyExpressServer(container, null, null, customApp);
  return server.build();
}

describe('Test Verifier controller', () => {

  const notExistsVerificationId = 'afde0e7d-3a1f-4d51-8dad-7d0229bd64c4';
  const forcedId = '395a0e7d-3a1f-4d51-8dad-7d0229bd64ac';
  const forcedCode = '12345678';

  it('will successfully validate verificationId and code - email', (done) => {

    createInitiateEmailVerification(forcedId, forcedCode).end((err, res) => {
      expect(res.status).is.equals(200);
      expect(res.body.verificationId).is.equals(forcedId);

      createRequest(`/methods/email/verifiers/${forcedId}/actions/validate`, {
        code: forcedCode
      }).end((err, res) => {
        expect(res.status).is.equals(200);
        expect(res.body.data.verificationId).is.equals('395a0e7d-3a1f-4d51-8dad-7d0229bd64ac');
        expect(res.body.data.consumer).is.equals('test@test.com');
        expect(res.body.data.expiredOn).to.be.an('number');
        expect(res.body.data.payload).to.deep.eq({
          key: 'value'
        });
        done();
      });
    });

  });

  it('will respond with 422 for incorrect code and increase attempts count - email', (done) => {

    createInitiateEmailVerification(forcedId, forcedCode).end((err, res) => {
      expect(res.status).is.equals(200);
      expect(res.body.verificationId).is.equals(forcedId);

      createRequest(`/methods/email/verifiers/${forcedId}/actions/validate`, {
        code: '123456'
      }).end((err, res) => {
        expect(res.status).is.equals(422);
        expect(res.body.data.verificationId).is.equals('395a0e7d-3a1f-4d51-8dad-7d0229bd64ac');
        expect(res.body.data.consumer).is.equals('test@test.com');
        expect(res.body.data.expiredOn).to.be.an('number');
        expect(res.body.data.payload).to.deep.eq({
          key: 'value'
        });
        expect(res.body.data.attempts).to.eq(1);
        expect(res.body.data).to.not.have.property('code');
        done();
      });
    });

  });

  it('will successfully get verification data - email', (done) => {

    createInitiateEmailVerification(forcedId, forcedCode).end((err, res) => {
      expect(res.status).is.equals(200);
      expect(res.body.verificationId).is.equals(forcedId);

      createRequest(`/methods/email/verifiers/${forcedId}`, null, 'get').end((err, res) => {
        expect(res.status).is.equals(200);
        expect(res.body.data.verificationId).is.equals('395a0e7d-3a1f-4d51-8dad-7d0229bd64ac');
        expect(res.body.data.consumer).is.equals('test@test.com');
        expect(res.body.data.expiredOn).to.be.an('number');
        expect(res.body.data.payload).to.deep.eq({
          key: 'value'
        });
        expect(res.body.data.attempts).to.eq(0);
        expect(res.body.data).to.not.have.property('code');
        done();
      });
    });

  });

  it('should respond with 404 if verification is not found - email', (done) => {
    createRequest(`/methods/email/verifiers/randomId`, null, 'get').end((err, res) => {
      expect(res.status).is.equals(404);
      done();
    });
  });

  it('will fail validation if verificationId not exists', (done) => {

    createRequest(`/methods/email/verifiers/${notExistsVerificationId}/actions/validate`, {
      code: '123456'
    }).end((err, res) => {
      expect(res.status).is.equals(404);
      expect(res.body.error).is.equals('Not found');
      done();
    });

  });

  it('will successfully remove verificationId', (done) => {

    createInitiateEmailVerification(forcedId, forcedCode).end((err, res) => {
      expect(res.status).is.equals(200);
      expect(res.body.verificationId).is.equals(forcedId);

      createRequest(`/methods/email/verifiers/${forcedId}`, {}, 'delete').end((err, res) => {
        expect(res.status).is.equals(200);
        done();
      });
    });

  });

  it('will fail remove if verificationId doesn\'t exists', (done) => {

    createRequest(`/methods/email/verifiers/${notExistsVerificationId}`, {}, 'delete').end((err, res) => {
      expect(res.status).is.equals(404);
      expect(res.body.error).is.equals('Not found');
      done();
    });

  });

  it('will successfully validate verificationId and code - authenticator', (done) => {
    const secret = {
      secret: '3qlq j5uj gdcj xoqt 6rhu yglx 5mf5 i7ll',
      verified: true
    };
    const verificationId = 'verificationId';
    const verificationData = {
      consumer: 'test@test.com',
      payload: {
        key: 'value'
      },
      attempts: 0
    };

    const testApp = mockStorageForGoogleAuth(secret, verificationId, verificationData);
    createRequest(`/methods/google_auth/verifiers/${ verificationId }/actions/validate`, {
      code: authenticator.generateToken(secret.secret)
    }, 'post', testApp).end((err, res) => {
      expect(res.status).is.equals(200);
      expect(res.body.data.consumer).is.eq('test@test.com');
      expect(res.body.data.payload).to.deep.eq({
        key: 'value'
      });
      done();
    });
  });

  it('will respond with 422 for incorrect code and increase attempts count - authenticator', (done) => {
    const secret = {
      secret: '3qlq j5uj gdcj xoqt 6rhu yglx 5mf5 i7ll',
      verified: true
    };
    const verificationId = 'verificationId';
    const verificationData = {
      consumer: 'test@test.com',
      payload: {
        key: 'value'
      },
      attempts: 0
    };

    const testApp = mockStorageForGoogleAuth(secret, verificationId, verificationData);
    createRequest(`/methods/google_auth/verifiers/${ verificationId }/actions/validate`, {
      code: authenticator.generateToken(secret.secret) + '1'
    }, 'post', testApp).end((err, res) => {
      expect(res.status).is.equals(422);
      expect(res.body.data.consumer).is.eq('test@test.com');
      expect(res.body.data.payload).to.deep.eq({
        key: 'value'
      });
      expect(res.body.data.attempts).to.eq(1);
      expect(res.body.data).to.not.have.property('code');
      done();
    });
  });
});

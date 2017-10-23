import { SimpleInMemoryStorageService, StorageServiceType } from '../storages';
import * as chai from 'chai';
import { BaseVerificationService } from '../base.verification';
import { container } from '../../ioc.container';
import { VerificationServiceFactoryRegister } from '../verifications';
import { NotFoundException, InvalidParametersException } from '../../exceptions/exceptions';
import AuthenticatorVerificationService from '../authenticator.verification';
import EmailVerificationService from '../email.verification';

chai.use(require('chai-as-promised'));

const {expect} = chai;

function createInitiateParams(params: any = {}) {
  return Object.assign({
    consumer: 'test@test.com'
  }, params, {
    policy: Object.assign({
      expiredOn: '01:00:00',
      forcedCode: '123'
    }, params.policy)
  });
}

const tenantData = {
  id: 'tenantId',
  isTenant: true,
  login: 'tenantLogin',
  jti: '1234',
  iat: 1234,
  aud: '123'
};

describe('Verifications Services', () => {
  container.rebind<StorageService>(StorageServiceType)
    .to(SimpleInMemoryStorageService);

  describe('Test VerificationServiceFactoryRegister', () => {
    let factory = container.resolve(VerificationServiceFactoryRegister);

    it('will have email method', () => {
      expect(factory.hasMethod('email')).is.eq(true);
    });

    it('will have google_auth method', () => {
      expect(factory.hasMethod('google_auth')).is.eq(true);
    });

    it('won\'t have unknown method', () => {
      expect(factory.hasMethod('unknown')).is.eq(false);
    });

    it('will create email verification service', () => {
      expect(factory.create('email')).is.instanceOf(EmailVerificationService);
    });

    it('will create google_auth verification service', () => {
      expect(factory.create('google_auth')).is.instanceOf(AuthenticatorVerificationService);
    });

    it('will throw when trying to create unsupported method', () => {
      expect(() => factory.create('random')).to.throw('random not supported');
    });
  });

  describe('Test BaseVerificationService', () => {
    class StubBaseVerificationService extends BaseVerificationService { }
    let storage = new SimpleInMemoryStorageService();
    let instance = new StubBaseVerificationService('stub', storage);

    it('will initiate a verification process', async() => {
      let result = await instance.initiate(createInitiateParams(), tenantData);

      expect(result).to.have.property('verificationId');
      expect(result.code).is.equals('123');
      expect(result.expiredOn).is.greaterThan(~~((+new Date()) / 1000));
    });

    it('will fail initiation of verification process if expiredOn is invalid', async() => {
      const params = createInitiateParams({
        policy: { expiredOn: null }
      });

      expect(instance.initiate(params, tenantData)).to.be.rejectedWith(InvalidParametersException);
    });

    it('will initiate of verification process if forcedVerificationId is set up', async() => {
      const forcedId = '886aa661-1fdb-4f29-b8e1-85ab6fc48912';
      const params = createInitiateParams({
        policy: { forcedVerificationId: forcedId }
      });

      expect((await instance.initiate(params, tenantData)).verificationId).is.equals(forcedId);
    });

    it('will initiate of verification process and return a new generated digital code', async() => {
      const params = {
        consumer: 'test@test.com',
        generateCode: {
          length: 16,
          symbolSet: ['DIGITS']
        },
        policy: {
          expiredOn: '01:00:00'
        }
      };

      const code = (await instance.initiate(params, tenantData)).code;
      expect(/^[\d]{16}$/.test(code)).is.eq(true);
    });

    it('will fail validation if verificationId doesn\'t existing', async() => {
      expect(instance.validate('zzz', {code: '123'}, tenantData)).to.be.rejectedWith(NotFoundException);
    });

    it('will fail validation if code is incorrect', async() => {
      const forcedId = '886aa661-1fdb-4f29-b8e1-85ab6fc48932';
      const initiateParams = createInitiateParams({
        policy: { forcedVerificationId: forcedId }
      });

      const verificationId = (await instance.initiate(initiateParams, tenantData)).verificationId;
      expect(verificationId).is.equals(forcedId);
      const isValid = (await instance.validate(forcedId, {code: '321'}, tenantData)).isValid;
      expect(isValid).is.eq(false);
    });

    it('will successfully validate if all is correct', async() => {
      const forcedId = '886aa661-1fdb-4f29-b8e1-85ab6fc48932';
      const initiateParams = createInitiateParams({
        policy: { forcedVerificationId: forcedId }
      });

      expect((await instance.initiate(initiateParams, tenantData)).verificationId).is.equals(forcedId);

      const isValid = (await instance.validate(forcedId, {code: '123'}, tenantData)).isValid;
      expect(isValid).is.eq(true);
    });

  });

  describe('Test EmailVerificationService', () => {
    let factory = container.resolve(VerificationServiceFactoryRegister);
    let instance: VerificationService = factory.create('email');

    it('will initiate and send an email', async() => {
      const forcedId = '886aa661-1fdb-4f29-b8e1-85ab6fc48932';
      const initiateParams = createInitiateParams({
        consumer: 'test@test.com',
        template: {
          'body': '[{{{CODE}}}]'
        },
        policy: { forcedVerificationId: forcedId }
      });

      expect(await instance.initiate(initiateParams, tenantData)).is.property('verificationId').equals(forcedId);
    });

  });

});

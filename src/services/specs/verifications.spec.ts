import { SimpleInMemoryStorageService, StorageServiceType, StorageService } from '../storages';
import { AuthenticationService, AuthenticationServiceType, ExternalHttpJwtAuthenticationService, JwtSingleInlineAuthenticationService, CachedAuthenticationDecorator } from '../auth';
import * as express from 'express';
import * as chai from 'chai';
import * as sinon from 'sinon';

import { container } from '../../ioc.container';
import { VerificationServiceFactoryRegister, VerificationService, BaseVerificationService, InvalidParametersException, NotFoundException } from '../verifications';

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

describe('Verifications Services', () => {
  container.rebind<StorageService>(StorageServiceType)
    .to(SimpleInMemoryStorageService);

  describe('Test VerificationServiceFactoryRegister', () => {
    let factory = container.resolve(VerificationServiceFactoryRegister);

    it('will have email method', () => {
      expect(factory.hasMethod('email')).is.true;
    });

    it('will haven\'t unknown method', () => {
      expect(factory.hasMethod('unknown')).is.false;
    });

    it('will create email verification service', () => {
      expect(factory.create('email')).is.instanceOf(BaseVerificationService);
    });
  });

  describe('Test BaseVerificationService', () => {
    class StubBaseVerificationService extends BaseVerificationService { }
    let storage = new SimpleInMemoryStorageService();
    let instance = new StubBaseVerificationService('stub', storage);

    it('will initiate a verification process', async() => {
      let result = await instance.initiate(createInitiateParams());

      expect(result.verificationId).is.exist;
      expect(result.code).is.equals('123');
      expect(result.expiredOn).is.greaterThan(~~((+new Date()) / 1000));
    });

    it('will fail initiation of verification process if expiredOn is invalid', async() => {
      expect(instance.initiate(createInitiateParams({
        policy: { expiredOn: null }
      }))).to.be.rejectedWith(InvalidParametersException);
    });

    it('will fail initiation of verification process if generateCode not exists', async() => {
      expect(
        instance.initiate(createInitiateParams({policy: { forcedCode: undefined }}))
      ).to.be.rejectedWith(InvalidParametersException);
    });

    it('will initiate of verification process if forcedVerificationId is set up', async() => {
      const forcedId = '886aa661-1fdb-4f29-b8e1-85ab6fc48912';
      expect((await instance.initiate(createInitiateParams({
        policy: { forcedVerificationId: forcedId }
      }))).verificationId).is.equals(forcedId);
    });

    it('will initiate of verification process and return a new generated digital code', async() => {
      expect(
        /^[\d]{16}$/.test((await instance.initiate(createInitiateParams({
          generateCode: {
            length: 16,
            symbolSet: ['DIGITS']
          },
          policy: { forcedCode: undefined }
        }))).code)
      ).is.true;
    });

    it('will fail validation if verificationId doesn\'t existing', async() => {
      expect(instance.validate('zzz', {code: '123'})).to.be.rejectedWith(NotFoundException);
    });

    it('will fail validation if code is incorrect', async() => {
      const forcedId = '886aa661-1fdb-4f29-b8e1-85ab6fc48932';
      expect((await instance.initiate(createInitiateParams({
        policy: { forcedVerificationId: forcedId }
      }))).verificationId).is.equals(forcedId);
      expect(await instance.validate(forcedId, {code: '321'})).is.false;
    });

    it('will successfully validate if all is correct', async() => {
      const forcedId = '886aa661-1fdb-4f29-b8e1-85ab6fc48932';
      expect((await instance.initiate(createInitiateParams({
        policy: { forcedVerificationId: forcedId }
      }))).verificationId).is.equals(forcedId);
      expect(await instance.validate(forcedId, {code: '123'})).is.true;
    });

  });

  describe('Test EmailVerificationService', () => {
    let factory = container.resolve(VerificationServiceFactoryRegister);
    let instance: VerificationService = factory.create('email');

    it('will initiate and send an email', async() => {
      const forcedId = '886aa661-1fdb-4f29-b8e1-85ab6fc48932';
      expect(await instance.initiate(createInitiateParams({
        consumer: 'test@test.com',
        template: {
          'body': '[{{{CODE}}}]'
        },
        policy: { forcedVerificationId: forcedId }
      }))).is.property('verificationId').equals(forcedId);
    });

  });

});

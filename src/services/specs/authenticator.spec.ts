import * as chai from 'chai';
import AuthenticatorVerificationService from '../authenticator.verification';
import { SimpleInMemoryStorageService } from '../storages';
import * as TypeMoq from 'typemoq';
import * as authenticator from 'authenticator';

chai.use(require('chai-as-promised'));
const { expect } = chai;

const tenantData = {
  id: 'tenantId',
  isTenant: true,
  login: 'tenantLogin',
  jti: '1234',
  iat: 1234,
  aud: '123'
};

describe('Authenticator service', () => {
  describe('Initiate', () => {
    it('should initiate verification - also generate secret for consumer if no secret yet', async() => {
      const storageMock = TypeMoq.Mock.ofType(SimpleInMemoryStorageService);
      storageMock.setup(x => x.get(TypeMoq.It.isAny(), TypeMoq.It.isAny()))
        .returns(async(): Promise<any> => null);

      this.authenticator = new AuthenticatorVerificationService('test', storageMock.object);

      const input = {
        consumer: 'test@test.com',
        issuer: 'Jincor',
        policy: {
          expiredOn: '01:00:00',
          forcedCode: '123'
        }
      };

      const result = await this.authenticator.initiate(input, tenantData);
      expect(result.totpUri).contains('otpauth://totp/Jincor:test@test.com?secret=');
      storageMock.verify(
        x => x.set(TypeMoq.It.isValue('testtenantIdtest@test.com'), TypeMoq.It.isAny()),
        TypeMoq.Times.once()
      );
    });

    it('should initiate verification - also generate secret for consumer if old secret is not verified', async() => {
      const secret = {
        secret: '3qlq j5uj gdcj xoqt 6rhu yglx 5mf5 i7ll',
        verified: false
      };

      const storageMock = TypeMoq.Mock.ofType(SimpleInMemoryStorageService);
      storageMock.setup(x => x.get(TypeMoq.It.isAny(), TypeMoq.It.isAny()))
        .returns(async(): Promise<any> => secret);

      this.authenticator = new AuthenticatorVerificationService('test', storageMock.object);

      const input = {
        consumer: 'test@test.com',
        issuer: 'Jincor',
        policy: {
          expiredOn: '01:00:00',
          forcedCode: '123'
        }
      };

      const result = await this.authenticator.initiate(input, tenantData);
      expect(result.totpUri).contains('otpauth://totp/Jincor:test@test.com?secret=');
      storageMock.verify(x => x.set(TypeMoq.It.isValue('testtenantIdtest@test.com'), TypeMoq.It.isAny()), TypeMoq.Times.once());
    });

    it('should initiate verification - use existing secret', async() => {
      const storageMock = TypeMoq.Mock.ofType(SimpleInMemoryStorageService);
      const secret = {
        secret: '3qlq j5uj gdcj xoqt 6rhu yglx 5mf5 i7ll',
        verified: true
      };

      storageMock.setup(x => x.get(TypeMoq.It.isAny(), TypeMoq.It.isAny()))
        .returns(async(): Promise<any> => secret);

      this.authenticator = new AuthenticatorVerificationService('test', storageMock.object);

      const input = {
        consumer: 'test@test.com',
        issuer: 'Jincor',
        policy: {
          expiredOn: '01:00:00',
          forcedCode: '123'
        }
      };

      const result = await this.authenticator.initiate(input, tenantData);
      expect(result).to.not.have.property('totpUri');
    });

    describe('Validate', () => {
      it('should validate verification - correct code', async() => {
        const secret = {
          secret: '3qlq j5uj gdcj xoqt 6rhu yglx 5mf5 i7ll',
          verified: true
        };
        const verificationId = 'verificationId';
        const verificationData = {
          consumer: 'test@test.com'
        };

        const storageMock = TypeMoq.Mock.ofType(SimpleInMemoryStorageService);
        storageMock.setup(x => x.get(TypeMoq.It.isValue(`test${ verificationId }`), TypeMoq.It.isAny()))
          .returns(async(): Promise<any> => verificationData);

        storageMock.setup(x => x.get(TypeMoq.It.isValue('testtenantIdtest@test.com'), TypeMoq.It.isAny()))
          .returns(async(): Promise<any> => secret);

        this.authenticator = new AuthenticatorVerificationService('test', storageMock.object);

        const input = {
          consumer: 'test@test.com',
          code: authenticator.generateToken(secret.secret)
        };

        const result = await this.authenticator.validate(verificationId, input, tenantData);
        expect(result.isValid).to.eq(true);
      });

      it('should validate verification - correct code, should verify secret if not verified yet', async() => {
        const secret = {
          secret: '3qlq j5uj gdcj xoqt 6rhu yglx 5mf5 i7ll',
          verified: false
        };

        const verificationId = 'verificationId';
        const verificationData = {
          consumer: 'test@test.com'
        };

        const storageMock = TypeMoq.Mock.ofType(SimpleInMemoryStorageService);
        storageMock.setup(x => x.get(TypeMoq.It.isValue(`test${ verificationId }`), TypeMoq.It.isAny()))
          .returns(async(): Promise<any> => verificationData);

        storageMock.setup(x => x.get(TypeMoq.It.isValue('testtenantIdtest@test.com'), TypeMoq.It.isAny()))
          .returns(async(): Promise<any> => secret);

        this.authenticator = new AuthenticatorVerificationService('test', storageMock.object);

        const input = {
          consumer: 'test@test.com',
          code: authenticator.generateToken(secret.secret)
        };

        const result = await this.authenticator.validate(verificationId, input, tenantData);
        expect(result.isValid).to.eq(true);

        const expectedSecret = {
          secret: '3qlq j5uj gdcj xoqt 6rhu yglx 5mf5 i7ll',
          verified: true
        };

        storageMock.verify(
          x => x.set(TypeMoq.It.isValue('testtenantIdtest@test.com'), TypeMoq.It.isValue(expectedSecret)),
          TypeMoq.Times.once()
        );
      });

      it('should validate verification - incorrect code', async() => {
        const secret = {
          secret: '3qlq j5uj gdcj xoqt 6rhu yglx 5mf5 i7ll',
          verified: true
        };
        const verificationId = 'verificationId';
        const verificationData = {
          consumer: 'test@test.com'
        };

        const storageMock = TypeMoq.Mock.ofType(SimpleInMemoryStorageService);
        storageMock.setup(x => x.get(TypeMoq.It.isValue(`test${ verificationId }`), TypeMoq.It.isAny()))
          .returns(async(): Promise<any> => verificationData);

        storageMock.setup(x => x.get(TypeMoq.It.isValue('testtenantIdtest@test.com'), TypeMoq.It.isAny()))
          .returns(async(): Promise<any> => secret);

        this.authenticator = new AuthenticatorVerificationService('test', storageMock.object);

        const input = {
          consumer: 'test@test.com',
          code: authenticator.generateToken(secret.secret) + 1
        };

        const result = await this.authenticator.validate(verificationId, input, tenantData);
        expect(result.isValid).to.eq(false);
      });

      it('should remove secret if param is set', async() => {
        const secret = {
          secret: '3qlq j5uj gdcj xoqt 6rhu yglx 5mf5 i7ll',
          verified: true
        };
        const verificationId = 'verificationId';
        const verificationData = {
          consumer: 'test@test.com'
        };

        const storageMock = TypeMoq.Mock.ofType(SimpleInMemoryStorageService);
        storageMock.setup(x => x.get(TypeMoq.It.isValue(`test${ verificationId }`), TypeMoq.It.isAny()))
          .returns(async(): Promise<any> => verificationData);

        storageMock.setup(x => x.get(TypeMoq.It.isValue('testtenantIdtest@test.com'), TypeMoq.It.isAny()))
          .returns(async(): Promise<any> => secret);

        storageMock.setup(x => x.remove(TypeMoq.It.isValue('testtenantIdtest@test.com')))
          .returns(async(): Promise<any> => null);

        this.authenticator = new AuthenticatorVerificationService('test', storageMock.object);

        const input = {
          consumer: 'test@test.com',
          code: authenticator.generateToken(secret.secret),
          removeSecret: true
        };

        const result = await this.authenticator.validate(verificationId, input, tenantData);
        expect(result.isValid).to.eq(true);
        storageMock.verify(x => x.remove(TypeMoq.It.isValue('testtenantIdtest@test.com')), TypeMoq.Times.once());
      });

      it('should throw when verification is not found', async() => {
        const verificationId = 'verificationId';

        const storageMock = TypeMoq.Mock.ofType(SimpleInMemoryStorageService);
        storageMock.setup(x => x.get(TypeMoq.It.isValue(`test${ verificationId }`), TypeMoq.It.isAny()))
          .returns(async(): Promise<any> => null);

        this.authenticator = new AuthenticatorVerificationService('test', storageMock.object);

        const input = {
          consumer: 'test@test.com',
          code: 123456
        };

        expect(this.authenticator.validate(verificationId, input)).to.be.rejectedWith('Verification is not found');
      });

      it('should throw when secret is not found', async() => {
        const verificationId = 'verificationId';
        const verificationData = {
          consumer: 'test@test.com'
        };

        const storageMock = TypeMoq.Mock.ofType(SimpleInMemoryStorageService);
        storageMock.setup(x => x.get(TypeMoq.It.isValue(`test${ verificationId }`), TypeMoq.It.isAny()))
          .returns(async(): Promise<any> => verificationData);

        storageMock.setup(x => x.get(TypeMoq.It.isValue('testtenantIdtest@test.com'), TypeMoq.It.isAny()))
          .returns(async(): Promise<any> => null);

        this.authenticator = new AuthenticatorVerificationService('test', storageMock.object);

        const input = {
          consumer: 'test@test.com',
          code: 123456
        };

        expect(this.authenticator.validate(verificationId, input, tenantData)).to.be.rejectedWith('User secret is not found');
      });
    });
  });
});

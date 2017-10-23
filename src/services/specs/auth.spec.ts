import { AuthenticationService, AuthenticationServiceType, ExternalHttpJwtAuthenticationService, JwtSingleInlineAuthenticationService, CachedAuthenticationDecorator } from '../auth';
import * as chai from 'chai';
import * as sinon from 'sinon';

import { container } from '../../ioc.container';

const {expect} = chai;

const tenantData = {
  id: 'tenantId',
  isTenant: true,
  login: 'tenantLogin',
  jti: '1234',
  iat: 1234,
  aud: '123'
};

describe('Auth Services', () => {

  describe('Test JwtSingleInlineAuthenticationService', () => {
    let instance: AuthenticationService;
    container.rebind<AuthenticationService>(AuthenticationServiceType)
      .to(JwtSingleInlineAuthenticationService);

    beforeEach(() => {
      instance = container.resolve(JwtSingleInlineAuthenticationService);
    });

    it('will not validate empty JWT string', async() => {
      expect(await instance.validate('')).is.eq(null);
    });

    it('will not validate with incorrect JWT string', async() => {
      expect(await instance.validate('not empty string')).is.eq(null);
    });

    it('will successfully validate with valid JWT string', async() => {
      expect(await instance.validate('TOKEN')).deep.eq(tenantData);
    });
  });

  describe('Test ExternalHttpJwtAuthenticationService', () => {
    let instance: AuthenticationService;
    container.rebind<AuthenticationService>(AuthenticationServiceType)
      .to(ExternalHttpJwtAuthenticationService);

    beforeEach(async() => {
      instance = container.resolve(ExternalHttpJwtAuthenticationService);
    });

    it('will not validate empty JWT string', async() => {
      let mock = sinon.mock(instance);
      mock.expects('callVerifyJwtTokenMethodEndpoint').never();
      expect(await instance.validate('')).is.eq(null);
      mock.verify();
    });

    it('will successfully validate with valid JWT string', async() => {
      let mock = sinon.mock(instance);
      mock.expects('callVerifyJwtTokenMethodEndpoint').once().returns(Promise.resolve(tenantData));
      expect(await instance.validate('not empty string')).deep.eq(tenantData);
      mock.verify();
    });
  });

  describe('Test CachedAuthenticationDecorator', () => {
    let mock;

    function createDecoratedInstance(returnResult: TenantVerificationResult) {
      let instance = {
        validate: (jwtToken: string): Promise<TenantVerificationResult> => Promise.resolve(returnResult)
      };
      mock = sinon.mock(instance);
      mock.expects('validate').once().returns(Promise.resolve(returnResult));

      return new CachedAuthenticationDecorator(instance);
    }

    it('will store a success validation result', async() => {
      let decoratedInstance = createDecoratedInstance(tenantData);

      expect(await decoratedInstance.validate('TOKEN')).is.eq(tenantData);
      expect(await decoratedInstance.validate('TOKEN')).is.eq(tenantData);

      mock.verify();
    });

    it('will store a failed validation result', async() => {
      let decoratedInstance = createDecoratedInstance(null);

      expect(await decoratedInstance.validate('TOKEN')).is.eq(null);
      expect(await decoratedInstance.validate('TOKEN')).is.eq(null);

      mock.verify();
    });
  });

});

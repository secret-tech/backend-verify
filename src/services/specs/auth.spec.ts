import { AuthenticationService, AuthenticationServiceType, ExternalHttpJwtAuthenticationService, JwtSingleInlineAuthenticationService, CachedAuthenticationDecorator } from '../auth';
import * as express from 'express';
import * as chai from 'chai';
import * as sinon from 'sinon';

import { container } from '../../ioc.container';

const {expect} = chai;

describe('Auth Services', () => {

  describe('Test JwtSingleInlineAuthenticationService', () => {
    let instance: AuthenticationService;
    container.rebind<AuthenticationService>(AuthenticationServiceType)
      .to(JwtSingleInlineAuthenticationService);

    beforeEach(() => {
      instance = container.resolve(JwtSingleInlineAuthenticationService);
    });

    it('will not validate empty JWT string', async() => {
      expect(await instance.validate('')).is.false;
    });

    it('will not validate with incorrect JWT string', async() => {
      expect(await instance.validate('not empty string')).is.false;
    });

    it('will successfully validate with valid JWT string', async() => {
      expect(await instance.validate('TOKEN')).is.true;
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
      expect(await instance.validate('')).is.false;
      mock.verify();
    });

    it('will successfully validate with valid JWT string', async() => {
      let mock = sinon.mock(instance);
      mock.expects('callVerifyJwtTokenMethodEndpoint').once().returns(Promise.resolve(true));
      expect(await instance.validate('not empty string')).is.true;
      mock.verify();
    });
  });

  describe('Test CachedAuthenticationDecorator', () => {
    let mock;

    function createDecoratedInstance(returnResult: boolean) {
      let instance = {
        validate: (jwtToken: string): Promise<boolean> => Promise.resolve(returnResult)
      };
      mock = sinon.mock(instance);
      mock.expects('validate').once().returns(Promise.resolve(returnResult));

      return new CachedAuthenticationDecorator(instance);
    }

    it('will store a success validation result', async() => {
      let decoratedInstance = createDecoratedInstance(true);

      expect(await decoratedInstance.validate('TOKEN')).is.true;
      expect(await decoratedInstance.validate('TOKEN')).is.true;

      mock.verify();
    });

    it('will store a failed validation result', async() => {
      let decoratedInstance = createDecoratedInstance(false);

      expect(await decoratedInstance.validate('TOKEN')).is.false;
      expect(await decoratedInstance.validate('TOKEN')).is.false;

      mock.verify();
    });
  });

});

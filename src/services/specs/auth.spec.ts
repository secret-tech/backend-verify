import { AuthenticationService, AuthenticationServiceType, ExternalHttpJwtAuthenticationService, JwtSingleInlineAuthenticationService } from '../auth'
import * as express from 'express'
import * as chai from 'chai'
import { container } from '../../ioc.container'
import * as sinon from 'sinon'

const {expect} = chai

const app: express.Application = express()

describe('Auth Services', () => {
  describe('Test JwtSingleInlineAuthenticationService', () => {
    let instance: AuthenticationService
    beforeEach(async() => {
      container.rebind<AuthenticationService>(AuthenticationServiceType)
        .to(JwtSingleInlineAuthenticationService)
      instance = container.resolve(JwtSingleInlineAuthenticationService)
    })

    it('will not validate empty JWT string', async() => {
      expect(await instance.validate('')).is.false
    })

    it('will not validate with incorrect JWT string', async() => {
      expect(await instance.validate('not empty string')).is.false
    })

    it('will success validate with JWT string', async() => {
      expect(await instance.validate('TOKEN')).is.true
    })
  })

  describe('Test ExternalHttpJwtAuthenticationService', () => {
    let instance: AuthenticationService
    beforeEach(async() => {
      container.rebind<AuthenticationService>(AuthenticationServiceType)
        .to(ExternalHttpJwtAuthenticationService)
      instance = container.resolve(ExternalHttpJwtAuthenticationService)
    })

    it('will not validate empty JWT string', async() => {
      let mock = sinon.mock(instance)
      mock.expects('callVerifyJwtTokenMethodEndpoint').once().returns(Promise.resolve(false))
      expect(await instance.validate('')).is.false
    })

    it('will success validate not empty JWT string', async() => {
      let mock = sinon.mock(instance)
      mock.expects('callVerifyJwtTokenMethodEndpoint').once().returns(Promise.resolve(true))
      expect(await instance.validate('not empty string')).is.true
    })
  })
})

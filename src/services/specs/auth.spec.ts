import { AuthenticationService, AuthenticationServiceType, ExternalHttpJwtAuthenticationService, JwtTestableInlineAuthenticationService } from '../auth'
import * as express from 'express'
import * as chai from 'chai'
import { container } from '../../ioc.container'
import * as sinon from 'sinon'

const {expect} = chai

const app: express.Application = express()

describe('Auth Services', () => {
  describe('Test JwtTestableInlineAuthenticationService', () => {
    let instance: AuthenticationService
    beforeEach(async() => {
      container.rebind<AuthenticationService>(AuthenticationServiceType)
        .to(JwtTestableInlineAuthenticationService)
      instance = container.resolve(JwtTestableInlineAuthenticationService)
    })

    it('will not validate empty JWT string', async() => {
      expect(await instance.validate('')).is.false
    })

    it('will success validate not empty JWT string', async() => {
      expect(await instance.validate('not empty string')).is.true
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
      mock.expects('callValidateMethod').once().returns(Promise.resolve(false))
      expect(await instance.validate('')).is.false
    })

    it('will success validate not empty JWT string', async() => {
      let mock = sinon.mock(instance)
      mock.expects('callValidateMethod').once().returns(Promise.resolve(true))
      expect(await instance.validate('not empty string')).is.true
    })
  })
})

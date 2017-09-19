import * as express from 'express'
import * as chai from 'chai'
import { container } from '../../ioc.container'
import { AuthMiddleware, AuthMiddlewareType } from '../common'
import { AuthenticationService, AuthenticationServiceType, JwtSingleInlineAuthenticationService } from '../../services/auth'

chai.use(require('chai-http'))
const {expect, request} = chai

container.rebind<AuthenticationService>(AuthenticationServiceType)
  .to(JwtSingleInlineAuthenticationService)

const authMiddleware = container.resolve(AuthMiddleware)
const app: express.Application = express()
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => authMiddleware.execute(req, res, next))

describe('Common Middlewares', () => {
  describe('Test AuthMiddleware', () => {

    it('will not authorize without JWT token in the header', (done) => {
      request(app).get('/any-url').end((err, res) => {
        expect(res.status).to.equal(401)
        done()
      })
    })

    it('will not authorize with JWT token that invalid formatted', (done) => {
      request(app).get('/any-url').set('Authorization', 'InvalidHeaderValue').end((err, res) => {
        expect(res.status).to.equal(401)
        done()
      })
    })

    it('will authorize with special JWT token in the header', (done) => {
      request(app).get('/any-url').set('Authorization', 'Bearer TOKEN').end((err, res) => {
        expect(res.status).to.equal(404)
        done()
      })
    })

  })
})

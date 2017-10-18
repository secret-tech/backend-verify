import * as express from 'express';
import * as chai from 'chai';
import { container } from '../../ioc.container';
import { AuthMiddleware, AuthMiddlewareType, SupportedMethodsMiddleware } from '../common';
import { AuthenticationService, AuthenticationServiceType, JwtSingleInlineAuthenticationService } from '../../services/auth';

chai.use(require('chai-http'));
const {expect, request} = chai;

describe('Common Middlewares', () => {

  describe('Test AuthMiddleware', () => {

    const authMiddleware = container.resolve(AuthMiddleware);
    const app: express.Application = express();
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => authMiddleware.execute(req, res, next));

    it('will not authorize without JWT token in the header', (done) => {
      request(app).get('/any-url').end((err, res) => {
        expect(res.status).to.equal(401);
        done();
      });
    });

    it('will not authorize with JWT token that have invalid formatted', (done) => {
      request(app).get('/any-url').set('Authorization', 'InvalidHeaderValue').end((err, res) => {
        expect(res.status).to.equal(401);
        done();
      });
    });

    it('will authorize with valid JWT token in the header', (done) => {
      request(app).get('/any-url').set('Authorization', 'Bearer TOKEN').end((err, res) => {
        expect(res.status).to.equal(404);
        done();
      });
    });

  });

  describe('Test SupportedMethodsMiddleware', () => {

    const supportedMethodsMiddleware = container.resolve(SupportedMethodsMiddleware);
    const app: express.Application = express()
      .use('/methods/:method/verifiers', (req: express.Request, res: express.Response, next: express.NextFunction) => supportedMethodsMiddleware.execute(req, res, next))
      .use('/methods/:method/verifiers', (req: express.Request, res: express.Response, next: express.NextFunction) => res.status(200).json({}));

    it('will not accept unsupported method', (done) => {
      request(app).post('/methods/unsupported/verifiers')
        .end((err, res) => {
          expect(res.status).to.equal(404);
          expect(res.body.error).to.equal('Method not supported');
          done();
        });
    });

    it('will accept email method', (done) => {
      request(app).post('/methods/email/verifiers')
        .query({'method': 'email'})
        .end((err, res) => {
          expect(res.status).to.equal(200);
          done();
        });
    });

  });

});

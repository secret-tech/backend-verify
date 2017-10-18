import * as express from 'express';
import * as chai from 'chai';
import { validateRequest } from '../requests';
import * as bodyParser from 'body-parser';

chai.use(require('chai-http'));
const {expect, request} = chai;

function createApp() {
  const app: express.Application = express();
  return app.use(bodyParser.json());
}

function createRequest(app: express.Application, data: any) {
  return request(app).post('/').send(data);
}

describe('Requests Middlewares', () => {

  describe('ValidateRequest validator', () => {
    let app = createApp()
      .use((req: express.Request, res: express.Response, next: express.NextFunction) => validateRequest(req, res, next));

    it('will accept right filled request', (done) => {
      createRequest(app, {
        code: 'code'
      }).end((err, res) => {
        expect(res.status).to.equal(404);
        done();
      });
    });

    it('will not accept request with invalid fields', (done) => {
      createRequest(app, {
        code: 123
      }).end((err, res) => {
        expect(res.status).to.equal(422);
        done();
      });
    });

    it('will not accept request without required fields', (done) => {
      request(app).post('/').send({}).end((err, res) => {
        expect(res.status).to.equal(422);
        done();
      });
    });

  });

});

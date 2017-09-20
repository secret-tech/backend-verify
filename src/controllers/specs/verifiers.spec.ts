import * as express from 'express';
import * as chai from 'chai';
import * as bodyParser from 'body-parser';

import app from '../../server';

chai.use(require('chai-http'));
const {expect, request} = chai;

function createRequest(path: string, data: any) {
  return request(app).post(path)
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer TOKEN').send(data);
}

describe('Test Verifier controller', () => {

  it('will fail validation when verificationId not found', (done) => {
    const forcedId = '';
    createRequest('/methods/email/verifiers/395a0e7d-3a1f-4d51-8dad-7d0229bd64c4/actions/validate', {
      code: '123456'
    }).end((err, res) => {
      expect(res.status).is.equals(404);
      expect(res.body.error).is.equals('Not found');
      done();
    });
  });

});

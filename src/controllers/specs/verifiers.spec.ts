import * as express from 'express';
import * as chai from 'chai';
import * as bodyParser from 'body-parser';

import { container } from '../../ioc.container';
import app from '../../server';

import { VerificationServiceFactoryRegister, VerificationService } from '../../services/verifications';

chai.use(require('chai-http'));
const {expect, request} = chai;

function createRequest(path: string, data: any, method: string = 'post') {
  return request(app)[method](path)
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer TOKEN').send(data);
}

function createInitiateEmailVerification(verificationId: string, code: string) {
  return createRequest('/methods/email/actions/initiate', {
    consumer: 'test@test.com',
    template: {
      body: 'body'
    },
    policy: {
      expiredOn: '00:01:00',
      forcedCode: code,
      forcedVerificationId: verificationId
    }
  });
}

describe('Test Verifier controller', () => {

  const notExistsVerificationId = 'afde0e7d-3a1f-4d51-8dad-7d0229bd64c4';
  const forcedId = '395a0e7d-3a1f-4d51-8dad-7d0229bd64ac';
  const forcedCode = '12345678';

  it('will successfully validate verificationId and code', (done) => {

    createInitiateEmailVerification(forcedId, forcedCode).end((err, res) => {
      expect(res.status).is.equals(200);
      expect(res.body.verificationId).is.equals(forcedId);

      createRequest(`/methods/email/verifiers/${forcedId}/actions/validate`, {
        code: forcedCode
      }).end((err, res) => {
        expect(res.status).is.equals(200);
        expect(res.body.data.verificationId).is.equals('395a0e7d-3a1f-4d51-8dad-7d0229bd64ac');
        expect(res.body.data.consumer).is.equals('test@test.com');
        expect(res.body.data.expiredOn).to.be.an('number');
        done();
      });
    });

  });

  it('will fail validation if verificationId not exists', (done) => {

    createRequest(`/methods/email/verifiers/${notExistsVerificationId}/actions/validate`, {
      code: '123456'
    }).end((err, res) => {
      expect(res.status).is.equals(404);
      expect(res.body.error).is.equals('Not found');
      done();
    });

  });

  it('will successfully removed verificationId', (done) => {

    createInitiateEmailVerification(forcedId, forcedCode).end((err, res) => {
      expect(res.status).is.equals(200);
      expect(res.body.verificationId).is.equals(forcedId);

      createRequest(`/methods/email/verifiers/${forcedId}`, {}, 'delete').end((err, res) => {
        expect(res.status).is.equals(200);
        done();
      });
    });

  });

  it('will fail remove if verificationId doesn\'t exists', (done) => {

    createRequest(`/methods/email/verifiers/${notExistsVerificationId}`, {}, 'delete').end((err, res) => {
      expect(res.status).is.equals(404);
      expect(res.body.error).is.equals('Not found');
      done();
    });

  });

});

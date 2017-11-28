import * as chai from 'chai';
import app from '../../server';

chai.use(require('chai-http'));
const {expect, request} = chai;

function createRequest(path: string, data: any) {
  return request(app).post(path)
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer TOKEN').send(data);
}

describe('Test Methods controller', () => {

  it('will initiate a email verification process', (done) => {
    const forcedId = '395a0e7d-3a1f-4d51-8dad-7d0229bd64ac';
    createRequest('/methods/email/actions/initiate', {
      consumer: 'test@test.com',
      template: {
        fromName: 'Sender Name',
        fromEmail: 'source@email.com',
        body: 'body'
      },
      policy: {
        expiredOn: '00:01:00',
        forcedCode: '123456',
        forcedVerificationId: forcedId
      }
    }).end((err, res) => {
      expect(res.status).is.equals(200);
      expect(res.body.verificationId).is.equals(forcedId);
      expect(res.body.expiredOn).is.greaterThan(~~((+new Date()) / 1000));
      done();
    });
  });

  it('will initiate a email verification process and accept payload', (done) => {
    const forcedId = '395a0e7d-3a1f-4d51-8dad-7d0229bd64ac';
    createRequest('/methods/email/actions/initiate', {
      consumer: 'test@test.com',
      template: {
        fromName: 'Sender Name',
        fromEmail: 'source@email.com',
        body: 'body'
      },
      policy: {
        expiredOn: '00:01:00',
        forcedCode: '123456',
        forcedVerificationId: forcedId
      },
      payload: {
        sub: {
          key: 'value'
        },
        key: 'value'
      }
    }).end((err, res) => {
      expect(res.status).is.equals(200);
      expect(res.body.verificationId).is.equals(forcedId);
      expect(res.body.expiredOn).is.greaterThan(~~((+new Date()) / 1000));
      expect(res.body.payload).to.deep.eq({
        sub: {
          key: 'value'
        },
        key: 'value'
      });
      done();
    });
  });

  it('will initiate an authenticator verification process', (done) => {
    const params = {
      consumer: 'test@test.com',
      issuer: 'Jincor',
      policy: {
        expiredOn: '00:01:00'
      },
      payload: {
        sub: {
          key: 'value'
        },
        key: 'value'
      }
    };

    createRequest('/methods/google_auth/actions/initiate', params).end((err, res) => {
      expect(res.status).is.equals(200);
      expect(res.body).to.have.property('verificationId');
      expect(res.body.expiredOn).is.greaterThan(~~((+new Date()) / 1000));
      expect(res.body.totpUri).contains('otpauth://totp/Jincor:test@test.com?secret=');
      expect(res.body.payload).to.deep.eq({
        sub: {
          key: 'value'
        },
        key: 'value'
      });
      done();
    });
  });

  it('will initiate an authenticator verification process and accept payload', (done) => {
    const params = {
      consumer: 'test@test.com',
      issuer: 'Jincor',
      policy: {
        expiredOn: '00:01:00'
      }
    };

    createRequest('/methods/google_auth/actions/initiate', params).end((err, res) => {
      expect(res.status).is.equals(200);
      expect(res.body).to.have.property('verificationId');
      expect(res.body.expiredOn).is.greaterThan(~~((+new Date()) / 1000));
      expect(res.body.totpUri).contains('otpauth://totp/Jincor:test@test.com?secret=');
      done();
    });
  });

  it('will require issuer param for google_auth initiate', (done) => {
    const params = {
      consumer: 'test@test.com',
      policy: {
        expiredOn: '00:01:00'
      }
    };

    createRequest('/methods/google_auth/actions/initiate', params).end((err, res) => {
      expect(res.status).is.equals(422);
      done();
    });
  });

  it('will fail of initiation of email verification process if no template body presents', (done) => {
    const forcedId = '395a0e7d-3a1f-4d51-8dad-7d0229bd64ac';
    createRequest('/methods/email/actions/initiate', {
      consumer: 'test@test.com',
      template: {
      },
      policy: {
        expiredOn: '00:01:00',
        forcedCode: '123456',
        forcedVerificationId: forcedId
      }
    }).end((err, res) => {
      expect(res.status).is.equals(422);
      expect(res.body.error).is.equals('Invalid request');
      done();
    });
  });

});

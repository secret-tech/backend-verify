import * as express from 'express';
import * as chai from 'chai';
import * as sinon from 'sinon';

import { DummyEmailProvider, MailgunEmailProvider } from '../email';
import { InvalidParametersException } from '../index';

const {expect} = chai;

describe('Email Providers', () => {

  describe('Test DummyEmailProvider', () => {

    it('will get dummy name', async() => {
      expect(DummyEmailProvider.getName()).is.equals('dummy');
    });

    it('will send an email', async() => {
      let instance = new DummyEmailProvider();
      expect(await instance.send(
        'test@test.com', ['test1@test1.com'], 'subject', 'email body'
      )).is.property('sender').equals('test@test.com');
    });

  });

  describe('Test MailgunEmailProvider', () => {

    const stubMailGunApi = {
      messages: () => stubMailGunApi,
      sendMime: (dataToSend, callback) => {
        callback(null, dataToSend.message);
      }
    };

    class StubMailgunEmailProvider extends MailgunEmailProvider {
      protected createMailgunApi(config: any) {
        return stubMailGunApi;
      }
    }

    it('will get mailgun name', async() => {
      expect(MailgunEmailProvider.getName()).is.equals('mailgun');
    });

    it('will throw NotProperlyInitializedException if incorrect MAILGUN_SECRET passed', async() => {
      expect(() => {
        const stubInstance = new StubMailgunEmailProvider({
          MAILGUN_SECRET: 'secret-12345',
          MAILGUN_DOMAIN: 'domain.com'
        });
      }).throws('MAILGUN_SECRET is invalid');
    });

    it('will throw NotProperlyInitializedException if incorrect MAILGUN_DOMAIN not passed', async() => {
      expect(() => {
        const stubInstance = new StubMailgunEmailProvider({
          MAILGUN_SECRET: 'key-12345'
        });
      }).throws('MAILGUN_DOMAIN is invalid');
    });

    it('will send an email', async() => {
      const stubInstance = new StubMailgunEmailProvider({
        MAILGUN_SECRET: 'key-12345',
        MAILGUN_DOMAIN: 'domain.com'
      });

      const bodyString = '<body>MESSAGE</body>';

      expect(await stubInstance.send('sender@sender.com', ['recipient@recipient.com'], 'subject', bodyString))
        .is.contains(bodyString);
    });

  });

});

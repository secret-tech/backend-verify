import * as express from 'express';
import * as chai from 'chai';
import * as sinon from 'sinon';

import { DummyEmailProvider } from '../email';

const {expect} = chai;

describe('Email Providers', () => {

  describe('Test DummyEmailProvider', () => {
    it('will get dummy name', async() => {
      expect(DummyEmailProvider.getName()).is.equals('dummy');
    });

    it('will do dummy send', async() => {
      let instance = new DummyEmailProvider();
      expect(await instance.send(
        'test@test.com', ['test1@test1.com'], 'subject', 'email body'
      )).is.property('sender').equals('test@test.com');
    });
  });

});

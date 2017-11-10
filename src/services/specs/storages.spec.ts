import * as chai from 'chai';

import { SimpleInMemoryStorageService, RedisStorageService } from '../storages';

const {expect} = chai;

function testStorageImplementation(instance: StorageService) {
  it('will set value', async() => {
    expect(await instance.set('field', 'value', { ttlInSeconds: 10 })).is.equals('value');
    expect(await instance.get('field', null)).is.equals('value');
  });

  it('will try to get not existing value and return default', async() => {
    expect(await instance.get('noField', 'default')).is.equals('default');
  });

  it('will remove exising value', async() => {
    expect(await instance.set('field', 'value', { ttlInSeconds: 10 })).is.equals('value');
    expect(await instance.remove('field')).is.equals('value');
  });
}

describe('Storages Services', () => {

  describe('Test SimpleInMemoryStorageService', () => {
    testStorageImplementation(new SimpleInMemoryStorageService());
  });

  describe('Test RedisStorageService', () => {
    class StubRedisStorageService extends RedisStorageService {
      protected createRedisClient(): any {
        let items = {};
        return {
          items: {},
          setex: (keyName, ttl, value, callback: () => void): boolean => {
            items[keyName] = value;
            callback();
            return true;
          },
          get: (keyName, callback: (err, result) => void): boolean => {
            callback(null, items[keyName]);
            return true;
          },
          del: (keyName, callback: (err, result) => void): boolean => {
            let value = items[keyName];
            delete items[keyName];
            callback(null, value);
            return true;
          }
        };
      }
    }
    let instance = new StubRedisStorageService();

    testStorageImplementation(instance);
  });

});

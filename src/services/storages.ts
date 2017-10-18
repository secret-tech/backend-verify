import { injectable } from 'inversify';
import * as redis from 'redis';
import { RedisClient } from 'redis';
import 'reflect-metadata';

import config from '../config';

// Exceptions

export class StorageException extends Error { }

// Types

export const StorageServiceType = Symbol('StorageServiceType');

/**
 * Storage Options
 */
export interface ValueOptions {
  ttlInSeconds: number;
}

/**
 * StorageService interface.
 */
export interface StorageService {

  /**
   * Set value
   *
   * @param name
   * @param value
   * @param options
   */
  set<T>(name: string, value: T, options: ValueOptions): Promise<T>;

  /**
   * Remove value
   *
   * @param name
   */
  remove<T>(name: string): Promise<T>;

  /**
   * Get value
   *
   * @param name
   * @param defaultValue
   */
  get<T>(name: string, defaultValue: T): Promise<T>;

}

/**
 * Very simple memory storage implementation.
 */
@injectable()
export class SimpleInMemoryStorageService implements StorageService {

  private storage: {
    [key: string]: {
      ttl: number;
      data: any;
    };
  } = {};
  private gcMinimalTimeInterval: number = 10;
  private lastGcTime: number = this.getNextGcTime();

  /**
   * @inheritdoc
   */
  public set<T>(name: string, value: T, options: ValueOptions): Promise<T> {
    this.gc();
    this.storage[name] = {
      ttl: options.ttlInSeconds * 1000 + +new Date(),
      data: value
    };
    return Promise.resolve(value);
  }

  /**
   * @inheritdoc
   */
  public remove<T>(name: string): Promise<T> {
    const value = typeof this.storage[name] === 'undefined' ? null : this.storage[name].data;
    delete this.storage[name];
    return Promise.resolve(value);
  }

  /**
   * @inheritdoc
   */
  public get<T>(name: string, defaultValue: T): Promise<T> {
    this.gc();
    return Promise.resolve(typeof this.storage[name] === 'undefined' ? defaultValue : this.storage[name].data);
  }

  /**
   * Execute simple garbage collection
   */
  public gc() {
    /* istanbul ignore if */
    if (this.lastGcTime < +new Date()) {
      Object.keys(this.storage).forEach((key) => {
        if (this.storage[key].ttl < +new Date()) {
          delete this.storage[key];
        }
      });
      this.lastGcTime = this.getNextGcTime();
    }
  }

  private getNextGcTime(): number {
    return this.gcMinimalTimeInterval * 1000 + (+new Date());
  }

}

const redisConfig = config.redis;

/**
 * Redis storage implementation.
 */
@injectable()
export class RedisStorageService implements StorageService {

  private client: RedisClient;

  constructor() {
    this.client = this.createRedisClient();
  }

  protected createRedisClient(): RedisClient {
    return redis.createClient(
      redisConfig.port,
      redisConfig.host,
      {
        db: redisConfig.database
        // retry_strategy: (s) => {}
        // prefix: redisConfig.prefix
      }
    );
  }

  /**
   * @inheritdoc
   */
  public set<T>(name: string, value: T, options: ValueOptions): Promise<T> {
    return new Promise((resolve, reject) => {
      this.client.setex(this.getKey(name),
        options.ttlInSeconds,
        JSON.stringify(value),
        (err: any, result) => {
          if (err) {
            return reject(new StorageException(err));
          }
          resolve(value);
        }
      );
    });
  }

  /**
   * @inheritdoc
   */
  public remove<T>(name: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.client.del(this.getKey(name),
        (err: any, result) => {
          if (err) {
            return reject(new StorageException(err));
          }
          try {
            resolve(JSON.parse(result));
          } catch (error) {
            reject(new StorageException(error));
          }
        }
      );
    });
  }

  /**
   * @inheritdoc
   */
  public get<T>(name: string, defaultValue: T): Promise<T> {
    return new Promise((resolve, reject) => {
      this.client.get(this.getKey(name),
        (err: any, result) => {
          if (err) {
            return reject(new StorageException(err));
          }
          try {
            if (!result) {
              return resolve(defaultValue);
            }
            resolve(JSON.parse(result));
          } catch (error) {
            reject(new StorageException(error));
          }
        }
      );
    });
  }

  private getKey(key: string): string {
    return redisConfig.prefix + key;
  }

}

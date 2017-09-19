import { injectable } from 'inversify'
import * as redis from 'redis'
import { RedisClient } from 'redis'
import 'reflect-metadata'

import config from '../config'

export const StorageServiceType = Symbol('StorageServiceType')

/**
 * Storage Options
 */
export interface ValueOptions {
  ttlInSeconds: number
}

/**
 * StorageService interface.
 */
export interface StorageService {

  set<T>(name: string, value: T, options: ValueOptions): Promise<T>
  remove<T>(name: string): Promise<T>
  get<T>(name: string, defaultValue: T): Promise<T>

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
  } = {}
  private gcMinimalTimeInterval: number = 10
  private lastGcTime: number = this.getNextGcTime()

  set<T>(name: string, value: T, options: ValueOptions): Promise<T> {
    this.gc()
    this.storage[name] = {
      ttl: options.ttlInSeconds * 1000 + +new Date(),
      data: value
    }
    return Promise.resolve(value)
  }

  remove<T>(name: string): Promise<T> {
    const value = typeof this.storage[name] === 'undefined' ? null : this.storage[name].data
    delete this.storage[name]
    return Promise.resolve(value)
  }

  get<T>(name: string, defaultValue: T): Promise<T> {
    this.gc()
    return Promise.resolve(typeof this.storage[name] === 'undefined' ? defaultValue : this.storage[name].data)
  }

  gc() {
    if (this.lastGcTime < +new Date()) {
      Object.keys(this.storage).forEach((key) => {
        if (this.storage[key].ttl < +new Date()) {
          delete this.storage[key]
        }
      })
      this.lastGcTime = this.getNextGcTime()
    }
  }

  private getNextGcTime(): number {
    return this.gcMinimalTimeInterval * 1000 + (+new Date())
  }

}

const redisConfig = config.redis

/**
 * Redis storage implementation.
 */
@injectable()
export class RedisStorageService implements StorageService {

  private client: RedisClient

  constructor() {
    this.client = redis.createClient(redisConfig.host, redisConfig.port)
  }

  set<T>(name: string, value: T, options: ValueOptions): Promise<T> {
    return new Promise((resolve, reject) => {
      this.client.setex(this.getKey(name), options.ttlInSeconds, value, (err, result) => err ? reject(err) : resolve(value))
    })
  }

  remove<T>(name: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.client.del(this.getKey(name), (err, result) => err ? reject(err) : resolve(result))
    })
  }

  get<T>(name: string, defaultValue: T): Promise<T> {
    return new Promise((resolve, reject) => {
      this.client.get(this.getKey(name), (err, result) => err ? reject(err) : resolve(result))
    })
  }

  getKey(key: string): string {
    return redisConfig.prefix + key
  }

}

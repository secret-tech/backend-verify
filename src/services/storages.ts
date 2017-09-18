export const StorageServiceType = Symbol('StorageServiceType')

/**
 * StorageService interface.
 */
export interface StorageService {

  set(name: string, value: any): Promise<any>
  remove(name: string): Promise<any>
  get(name: string, defaultValue: any): Promise<any>

}

/**
 * Simple memory storage implementation.
 */
export class SimpleInMemoryStorageService implements StorageService {

  set(name: string, value: any): Promise<any> {
    return Promise.resolve(value)
  }

  remove(name: string): Promise<any> {
    return Promise.resolve(name)
  }

  get(name: string, defaultValue: any): Promise<any> {
    return Promise.resolve(name)
  }

}

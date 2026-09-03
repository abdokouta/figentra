/**
 * @file async-storage-adapter.interface.ts
 * @module @stackra/config/src/interfaces
 * @description IAsyncStorageAdapter interface.
 */

/**
 * AsyncStorage interface (matches @react-native-async-storage/async-storage).
 */
export interface IAsyncStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
  multiGet(keys: readonly string[]): Promise<readonly [string, string | null][]>;
}

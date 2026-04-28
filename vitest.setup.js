import { beforeEach, vi } from 'vitest';
import { asyncStorageKV } from './src/test/asyncStorageMock.js';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key) =>
      Object.prototype.hasOwnProperty.call(asyncStorageKV, key) ? asyncStorageKV[key] : null,
    setItem: async (key, value) => {
      asyncStorageKV[key] = String(value);
    },
    removeItem: async (key) => {
      delete asyncStorageKV[key];
    },
    clear: async () => {
      Object.keys(asyncStorageKV).forEach((k) => delete asyncStorageKV[k]);
    },
  },
}));

beforeEach(() => {
  Object.keys(asyncStorageKV).forEach((k) => delete asyncStorageKV[k]);
});

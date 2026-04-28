/** Shared in-memory KV for Vitest — one store for all tests (AsyncStorage is mocked once globally). */
export const asyncStorageKV = Object.create(null);

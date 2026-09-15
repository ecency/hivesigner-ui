import { useSyncExternalStore } from 'react';
import { type AccountsState, getState, subscribe } from './accounts';

/** React view of the account store (see accounts.ts). Re-renders on any change. */
export function useAccounts(): AccountsState {
  return useSyncExternalStore(subscribe, getState, getState);
}

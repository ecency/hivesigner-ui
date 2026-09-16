import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  _resetKeyCache,
  addAccount,
  lockAccount,
  selectAccount,
} from './accounts';
import { useAccounts } from './use-accounts';

beforeEach(() => {
  localStorage.clear();
  _resetKeyCache();
});

describe('useAccounts', () => {
  it('re-renders as accounts are added, switched and locked', async () => {
    const { result } = renderHook(() => useAccounts());
    expect(result.current.usernames).toEqual([]);
    await act(async () => {
      await addAccount('alice', { posting: '5Ka' });
      await addAccount('bob', { posting: '5Kb' });
    });
    expect(result.current.usernames).toEqual(['alice', 'bob']);
    expect(result.current.selectedAccount).toBe('alice');
    expect(result.current.unlocked).toContain('bob');
    act(() => selectAccount('bob'));
    expect(result.current.selectedAccount).toBe('bob');
    act(() => lockAccount('bob'));
    expect(result.current.unlocked).not.toContain('bob');
  });
});

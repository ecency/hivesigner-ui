import { beforeEach, describe, expect, it, vi } from 'vitest';

const callRPC = vi.hoisted(() => vi.fn());

vi.mock('@ecency/sdk/hive', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@ecency/sdk/hive')>()),
  callRPC,
}));

import { getAllApps, getProfiles, getTopApps } from './hive';

// The chain-side directory reads in hive.ts: the follow list, the curated post
// and profile batching. These are what lib/app-directory.ts falls back to when
// the API cannot be reached, so they still have to work.
//
// Named for the module they TEST. They lived in app-directory.test.ts until the
// API client took that filename and silently overwrote all fifteen of them.

/** A page of follow rows, as condenser_api.get_following returns them. */
function rows(names: string[]) {
  return names.map((following) => ({ what: ['blog'], following }));
}

function name(i: number) {
  // Valid Hive names: start with a letter, 3-16 chars.
  return `app${String(i).padStart(4, '0')}`;
}

describe('getAllApps', () => {
  beforeEach(() => callRPC.mockReset());

  it('returns a single short page as-is', async () => {
    callRPC.mockResolvedValueOnce(rows(['ecency.app', 'peakd.app']));
    await expect(getAllApps()).resolves.toEqual(['ecency.app', 'peakd.app']);
    expect(callRPC).toHaveBeenCalledTimes(1);
  });

  // The node echoes the `start` account as the first row of the next page.
  // Keeping it would duplicate one name at every page boundary, and the page
  // size is 100, so a ~900-entry directory would gain 9 duplicate cards.
  it('drops the cursor row the node repeats at each page boundary', async () => {
    const first = Array.from({ length: 100 }, (_, i) => name(i));
    const second = [name(99), name(100), name(101)];
    callRPC
      .mockResolvedValueOnce(rows(first))
      .mockResolvedValueOnce(rows(second));

    const all = await getAllApps();
    expect(all).toHaveLength(102);
    expect(all.filter((n) => n === name(99))).toHaveLength(1);
    expect(all[100]).toBe(name(100));
    // Paged from the last name of the previous page.
    expect(callRPC).toHaveBeenNthCalledWith(2, 'condenser_api.get_following', [
      'hivesigner',
      name(99),
      'blog',
      100,
    ]);
  });

  it('keeps what it collected when a later page fails', async () => {
    const first = Array.from({ length: 100 }, (_, i) => name(i));
    callRPC
      .mockResolvedValueOnce(rows(first))
      .mockRejectedValueOnce(new Error('node down'));
    await expect(getAllApps()).resolves.toHaveLength(100);
  });

  // Returning [] here rendered a node outage as "there are no apps", a
  // different and much more alarming claim, and it denied React Query anything
  // to retry. The failure has to reach the caller.
  it('rethrows when the very first page fails, rather than reporting no apps', async () => {
    callRPC.mockRejectedValueOnce(new Error('node down'));
    await expect(getAllApps()).rejects.toThrow('node down');
  });

  // A node that ignores `start` hands back the same full page forever. The
  // dedup hides that from the RESULT, so asserting the returned names proves
  // nothing: it is the CALL COUNT that shows the loop noticed and stopped. An
  // earlier version of this test asserted `<= MAX_PAGES`, which was true even
  // with the guard deleted, so it was checking nothing.
  it('stops after one repeated page instead of spinning to the page cap', async () => {
    const page = Array.from({ length: 100 }, (_, i) => name(i));
    callRPC.mockResolvedValue(rows(page));
    const all = await getAllApps();
    expect(all).toHaveLength(100);
    expect(callRPC).toHaveBeenCalledTimes(2);
  });

  // The cap is a runaway guard, not a directory size limit. It used to be 20
  // pages, which would have silently dropped everything past ~2000 accounts and
  // presented the remainder as the complete list.
  it('pages well past the size of the directory today', async () => {
    // 30 full, progressing pages: more than the old cap allowed.
    for (let p = 0; p < 30; p++) {
      callRPC.mockResolvedValueOnce(
        rows(Array.from({ length: 100 }, (_, i) => name(p * 100 + i))),
      );
    }
    callRPC.mockResolvedValueOnce(rows([name(3000)]));
    const all = await getAllApps();
    expect(all).toHaveLength(3001);
  });

  it('refuses rows that are not valid account names', async () => {
    callRPC.mockResolvedValueOnce(
      rows(['ecency.app']).concat([
        { what: ['blog'], following: '../../etc/passwd' },
        { what: ['blog'], following: 'UPPER' },
        { what: ['blog'], following: '' },
      ] as never),
    );
    await expect(getAllApps()).resolves.toEqual(['ecency.app']);
  });
});

describe('getTopApps', () => {
  beforeEach(() => callRPC.mockReset());

  it('reads the curated list out of the post metadata', async () => {
    callRPC.mockResolvedValueOnce({
      json_metadata: JSON.stringify({ data: ['ecency.app', 'peakd.app'] }),
    });
    await expect(getTopApps()).resolves.toEqual(['ecency.app', 'peakd.app']);
  });

  it('drops entries that are not account names', async () => {
    callRPC.mockResolvedValueOnce({
      json_metadata: JSON.stringify({ data: ['ecency.app', 42, 'NOPE', null] }),
    });
    await expect(getTopApps()).resolves.toEqual(['ecency.app']);
  });

  it('survives unparsable metadata', async () => {
    callRPC.mockResolvedValueOnce({ json_metadata: 'not json' });
    await expect(getTopApps()).resolves.toEqual([]);
  });
});

describe('getProfiles', () => {
  beforeEach(() => callRPC.mockReset());

  it('reads name, about, website and creator out of posting metadata', async () => {
    callRPC.mockResolvedValueOnce([
      {
        name: 'ecency.app',
        posting_json_metadata: JSON.stringify({
          profile: {
            name: 'Ecency',
            about: 'Hive social',
            website: 'https://ecency.com',
            creator: 'good-karma',
          },
        }),
      },
    ]);
    const map = await getProfiles(['ecency.app']);
    expect(map['ecency.app']).toEqual({
      username: 'ecency.app',
      name: 'Ecency',
      about: 'Hive social',
      website: 'https://ecency.com',
      creator: 'good-karma',
    });
  });

  // Profile fields are written by the account itself. A non-string, or an
  // enormous string meant to blow up the card, must not reach the UI.
  it('ignores non-string fields and caps the length', async () => {
    callRPC.mockResolvedValueOnce([
      {
        name: 'ecency.app',
        posting_json_metadata: JSON.stringify({
          profile: {
            name: { evil: true },
            about: 'x'.repeat(5000),
            website: 42,
          },
        }),
      },
    ]);
    const p = (await getProfiles(['ecency.app']))['ecency.app'];
    expect(p.name).toBeUndefined();
    expect(p.website).toBeUndefined();
    expect(p.about).toHaveLength(500);
  });

  it('returns a bare profile when the metadata has none', async () => {
    callRPC.mockResolvedValueOnce([
      { name: 'ecency.app', posting_json_metadata: '' },
    ]);
    await expect(getProfiles(['ecency.app'])).resolves.toEqual({
      'ecency.app': { username: 'ecency.app' },
    });
  });

  it('makes no call at all for an empty or invalid name list', async () => {
    await expect(getProfiles([])).resolves.toEqual({});
    await expect(getProfiles(['NOPE', '../x'])).resolves.toEqual({});
    expect(callRPC).not.toHaveBeenCalled();
  });

  it('batches 100 names per call', async () => {
    const names = Array.from({ length: 150 }, (_, i) => name(i));
    callRPC.mockResolvedValue([]);
    await getProfiles(names);
    expect(callRPC).toHaveBeenCalledTimes(2);
    expect((callRPC.mock.calls[0][1] as [string[]])[0]).toHaveLength(100);
    expect((callRPC.mock.calls[1][1] as [string[]])[0]).toHaveLength(50);
  });
});

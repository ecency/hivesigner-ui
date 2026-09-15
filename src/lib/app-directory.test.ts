import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getTopApps = vi.hoisted(() => vi.fn());
const getAllApps = vi.hoisted(() => vi.fn());

vi.mock('./hive', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./hive')>()),
  getTopApps,
  getAllApps,
}));

import { fetchFromApi, getAppDirectory } from './app-directory';

function respond(body: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    })),
  );
}

const OK = {
  featured: [
    { username: 'ecency.app', name: 'Ecency', website: 'https://ecency.com' },
  ],
  directory: ['ecency.app', 'peakd.app'],
};

describe('fetchFromApi', () => {
  beforeEach(() => {
    getTopApps.mockReset();
    getAllApps.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('reads a well-formed response', async () => {
    respond(OK);
    await expect(fetchFromApi()).resolves.toEqual({
      featured: [
        {
          username: 'ecency.app',
          name: 'Ecency',
          website: 'https://ecency.com',
        },
      ],
      directory: ['ecency.app', 'peakd.app'],
      source: 'api',
    });
  });

  // This is a network response rendered on the screens that hand over posting
  // authority. It gets the same treatment as chain data: a name that cannot be
  // an account is dropped rather than escaped.
  it('drops entries whose username is not an account name', async () => {
    respond({
      featured: [
        { username: 'ecency.app' },
        { username: '../../etc/passwd' },
        { username: 'UPPER' },
        { username: 42 },
        null,
        'ecency.app',
      ],
      directory: ['peakd.app', '../x', '', 'NOPE'],
    });
    const r = await fetchFromApi();
    expect(r.featured.map((a) => a.username)).toEqual(['ecency.app']);
    expect(r.directory).toEqual(['peakd.app']);
  });

  it('caps the strings it will render', async () => {
    respond({
      featured: [
        {
          username: 'ecency.app',
          name: 'x'.repeat(5000),
          website: 'y'.repeat(5000),
        },
      ],
      directory: ['ecency.app'],
    });
    const app = (await fetchFromApi()).featured[0];
    expect(app.name).toHaveLength(200);
    expect(app.website).toHaveLength(500);
  });

  it('ignores non-string name and website', async () => {
    respond({
      featured: [{ username: 'ecency.app', name: { evil: true }, website: 7 }],
      directory: ['ecency.app'],
    });
    const app = (await fetchFromApi()).featured[0];
    expect(app.name).toBeUndefined();
    expect(app.website).toBeUndefined();
  });

  it.each([500, 503, 404])('rejects HTTP %i', async (status) => {
    respond({}, status);
    await expect(fetchFromApi()).rejects.toThrow();
  });

  it('rejects a body that is not an object', async () => {
    respond('nope');
    await expect(fetchFromApi()).rejects.toThrow();
  });

  // An empty answer would blank the apps page. The chain fallback can do
  // better, so this has to look like a failure rather than an empty directory.
  it('rejects an empty answer', async () => {
    respond({ featured: [], directory: [] });
    await expect(fetchFromApi()).rejects.toThrow(/empty/);
  });

  // Coercing a malformed field to [] returned a featured strip with no
  // directory behind it and never fell back - one blank page instead of the
  // chain answer that was available all along.
  it('rejects when ONE list is malformed and the other is fine', async () => {
    respond({ featured: OK.featured, directory: null });
    await expect(fetchFromApi()).rejects.toThrow(/directory is not a list/);
    respond({ featured: { nope: true }, directory: OK.directory });
    await expect(fetchFromApi()).rejects.toThrow(/featured is not a list/);
  });

  it('deduplicates repeated rows, as the chain path does', async () => {
    respond({
      featured: [
        { username: 'ecency.app' },
        { username: 'ecency.app', name: 'again' },
        { username: 'peakd.app' },
      ],
      directory: ['ecency.app', 'ecency.app', 'peakd.app'],
    });
    const r = await fetchFromApi();
    expect(r.featured.map((a) => a.username)).toEqual([
      'ecency.app',
      'peakd.app',
    ]);
    expect(r.directory).toEqual(['ecency.app', 'peakd.app']);
  });

  // The homepage maps every featured entry into the DOM and the apps page holds
  // the whole directory: an oversized answer would lock the page up rather than
  // merely look wrong.
  it('caps how much it will hand on to be rendered', async () => {
    const many = (n: number, prefix: string) =>
      Array.from(
        { length: n },
        (_, i) => `${prefix}${String(i).padStart(5, '0')}`,
      );
    respond({
      featured: many(400, 'app').map((username) => ({ username })),
      directory: many(20000, 'dir'),
    });
    const r = await fetchFromApi();
    expect(r.featured.length).toBeLessThanOrEqual(50);
    expect(r.directory.length).toBeLessThanOrEqual(5000);
  });
});

describe('getAppDirectory', () => {
  beforeEach(() => {
    getTopApps.mockReset();
    getAllApps.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('uses the API when it answers', async () => {
    respond(OK);
    const r = await getAppDirectory();
    expect(r.source).toBe('api');
    expect(getAllApps).not.toHaveBeenCalled();
  });

  // This is a signing app. It has to keep working when the API is down, and it
  // read all of this off the chain before the endpoint existed.
  it('falls back to the chain when the API fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    getTopApps.mockResolvedValue(['ecency.app']);
    getAllApps.mockResolvedValue(['ecency.app', 'peakd.app']);

    const r = await getAppDirectory();
    expect(r.source).toBe('chain');
    expect(r.featured).toEqual([{ username: 'ecency.app' }]);
    expect(r.directory).toEqual(['ecency.app', 'peakd.app']);
  });

  it('falls back when the API answers with rubbish', async () => {
    respond({ featured: 'not an array', directory: { nope: true } });
    getTopApps.mockResolvedValue(['ecency.app']);
    getAllApps.mockResolvedValue(['ecency.app']);
    await expect(getAppDirectory()).resolves.toMatchObject({ source: 'chain' });
  });

  // Promise.all threw away a featured list that had already arrived because the
  // ten-call follow list lost one page. They are independent; treat them so.
  it('keeps the featured list when the directory read fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('down');
      }),
    );
    getTopApps.mockResolvedValue(['ecency.app']);
    getAllApps.mockRejectedValue(new Error('node down'));
    const r = await getAppDirectory();
    expect(r.featured).toEqual([{ username: 'ecency.app' }]);
    expect(r.directory).toEqual([]);
  });

  it('keeps the directory when the curated read fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('down');
      }),
    );
    getTopApps.mockRejectedValue(new Error('node down'));
    getAllApps.mockResolvedValue(['ecency.app', 'peakd.app']);
    const r = await getAppDirectory();
    expect(r.featured).toEqual([]);
    expect(r.directory).toEqual(['ecency.app', 'peakd.app']);
  });

  // The homepage renders the featured strip only; paging ~900 accounts to fill
  // a list it never reads made an API outage expensive on the landing page.
  it('skips the directory read when the caller does not want it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('down');
      }),
    );
    getTopApps.mockResolvedValue(['ecency.app']);
    getAllApps.mockResolvedValue(['ecency.app']);
    const r = await getAppDirectory({ withDirectory: false });
    expect(getAllApps).not.toHaveBeenCalled();
    expect(r.featured).toEqual([{ username: 'ecency.app' }]);
  });
});

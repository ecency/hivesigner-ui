import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAppDirectory } from './app-directory';

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
  building: false,
  apps: [
    {
      username: 'ecency.app',
      name: 'Ecency',
      about: 'Hive social',
      website: 'https://ecency.com',
      site: 'ok',
      users: 412,
    },
    { username: 'peakd.app', name: 'PeakD', site: 'ok', users: 300 },
  ],
  featured: ['ecency.app', 'peakd.app'],
};

describe('fetchAppDirectory', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads a well-formed response', async () => {
    respond(OK);
    const r = await fetchAppDirectory();
    expect(r.building).toBe(false);
    expect(r.featured).toEqual(['ecency.app', 'peakd.app']);
    expect(r.apps[0]).toEqual({
      username: 'ecency.app',
      name: 'Ecency',
      about: 'Hive social',
      website: 'https://ecency.com',
      site: 'ok',
      users: 412,
    });
  });

  // A freshly deployed API has served nobody yet. That is a state with its own
  // message, not an error and not "there are no apps".
  it('reports the building state without treating it as a failure', async () => {
    respond({ building: true, apps: [], featured: [] });
    const r = await fetchAppDirectory();
    expect(r.building).toBe(true);
    expect(r.apps).toEqual([]);
  });

  // This is a network response rendered on the screens that hand over posting
  // authority: a name that cannot be an account is dropped, not escaped.
  it('drops entries whose username is not an account name', async () => {
    respond({
      apps: [
        { username: 'ecency.app', users: 1 },
        { username: '../../etc/passwd', users: 9 },
        { username: 'UPPER', users: 9 },
        { username: 42 },
        null,
        'ecency.app',
      ],
      featured: [],
    });
    const r = await fetchAppDirectory();
    expect(r.apps.map((a) => a.username)).toEqual(['ecency.app']);
  });

  // A featured name the response does not describe would render a card with
  // nothing behind it.
  it('ignores featured names that are not in the list', async () => {
    respond({
      apps: [{ username: 'ecency.app', users: 1 }],
      featured: ['ecency.app', 'ghost.app', 'NOPE', 'ecency.app'],
    });
    const r = await fetchAppDirectory();
    expect(r.featured).toEqual(['ecency.app']);
  });

  it('caps the strings it will render', async () => {
    respond({
      apps: [
        {
          username: 'ecency.app',
          name: 'x'.repeat(5000),
          about: 'y'.repeat(5000),
          website: 'z'.repeat(5000),
          users: 1,
        },
      ],
      featured: [],
    });
    const app = (await fetchAppDirectory()).apps[0];
    expect(app.name).toHaveLength(200);
    expect(app.about).toHaveLength(500);
    expect(app.website).toHaveLength(500);
  });

  it('ignores fields that are not the type they should be', async () => {
    respond({
      apps: [
        {
          username: 'ecency.app',
          name: { evil: true },
          website: 7,
          users: 'lots',
        },
      ],
      featured: [],
    });
    const app = (await fetchAppDirectory()).apps[0];
    expect(app.name).toBeUndefined();
    expect(app.website).toBeUndefined();
    expect(app.users).toBe(0);
  });

  it('deduplicates repeated rows', async () => {
    respond({
      apps: [
        { username: 'ecency.app', users: 2 },
        { username: 'ecency.app', name: 'again', users: 2 },
      ],
      featured: [],
    });
    expect((await fetchAppDirectory()).apps).toHaveLength(1);
  });

  // The page maps every entry into the DOM, so an oversized answer would lock
  // it up rather than merely look wrong.
  it('bounds how much it will hand on to be rendered', async () => {
    respond({
      apps: Array.from({ length: 9000 }, (_, i) => ({
        username: `app${String(i).padStart(5, '0')}`,
        users: 1,
      })),
      featured: [],
    });
    expect((await fetchAppDirectory()).apps.length).toBeLessThanOrEqual(2000);
  });

  // There is no fallback any more, so REJECTING is what makes /apps show its
  // error state with a retry rather than claiming the directory is empty.
  it.each([500, 503, 404])('rejects HTTP %i', async (status) => {
    respond({}, status);
    await expect(fetchAppDirectory()).rejects.toThrow();
  });

  it('rejects a body that is not an object', async () => {
    respond('nope');
    await expect(fetchAppDirectory()).rejects.toThrow();
  });

  it('rejects a malformed apps list rather than reading it as empty', async () => {
    respond({ apps: null, featured: [] });
    await expect(fetchAppDirectory()).rejects.toThrow(/apps is not a list/);
  });

  it('rejects when the request itself fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    await expect(fetchAppDirectory()).rejects.toThrow('network down');
  });
});

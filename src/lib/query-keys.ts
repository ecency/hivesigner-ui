/**
 * React Query keys, in one place.
 *
 * This file exists because of a real crash. Two different modules cached two
 * DIFFERENT shapes under the same hand-written key, `['app-profile', name]`:
 *
 *   - the app directory's profile (name/about/website/creator)
 *   - the OAuth consent screen's app profile, which also carries `redirectUris`
 *
 * The directory seeded that key while rendering /apps, so a user who opened an
 * OAuth request, clicked "Apps" in the navigation and went back got the wrong
 * shape handed to `profile.redirectUris.includes(...)` and saw "Something went
 * wrong!" instead of the consent screen. Nothing typed the cache, so nothing
 * caught it.
 *
 * Every cache key is built here so two shapes cannot quietly share one, and
 * query-keys.test.ts fails if any two builders ever produce the same key.
 */

/** The account's public profile as the app DIRECTORY needs it. */
export const directoryProfileKey = (username: string) =>
  ['directory-profile', username] as const;

/** The app profile the OAUTH consent screen needs, including redirectUris. */
export const oauthAppProfileKey = (clientId: string) =>
  ['oauth-app-profile', clientId] as const;

/** The ranked directory: featured list plus every registered app. */
export const appDirectoryKey = () => ['app-directory'] as const;

/** A Hive account, as read by the account/authority screens. */
export const accountKey = (username: string | null) =>
  ['account', username] as const;

/** The HP-per-VEST rate the sign screen needs to show an HP amount. */
export const vestsToSpKey = () => ['vests-to-sp'] as const;

/** A docs language's page list (src/docs/<lang>/pages.json). */
export const docsIndexKey = (lang: string) => ['docs-index', lang] as const;

/** One docs page, rendered, in one language. */
export const docsPageKey = (lang: string, slug: string) =>
  ['docs-page', lang, slug] as const;

/** Every key builder, for the collision test. Add new ones here too. */
export const ALL_KEY_BUILDERS = {
  directoryProfileKey,
  docsIndexKey,
  docsPageKey,
  oauthAppProfileKey,
  appDirectoryKey,
  accountKey,
  vestsToSpKey,
};

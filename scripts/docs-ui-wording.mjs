// The docs quote the app back at the reader: "Select **Add account**", "it
// says 'Wrong passcode.'". A translation is only useful if those quotes are
// the words that language's app really shows, so this compares every quoted
// label and message against src/i18n/locales.
//
// It is a script rather than a test on purpose: a Crowdin download changes
// the app's wording, and that should not fail CI on unrelated work. Run it
// after translating docs, and after a locale update that touches these keys:
//
//   node scripts/docs-ui-wording.mjs
//
// Only strings with no placeholder are checked. A page quotes the others with
// the value filled in (HOST, @USERNAME), so they cannot match literally.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGUAGES } from '../src/i18n/languages.ts';

/** The keys the docs quote as a label or a whole message. */
const QUOTED = `
message_signing.message_label message_signing.authority_label message_signing.sign_button
message_signing.summary message_signing.author message_signing.authority_used
message_signing.verification_token message_signing.verification_link
message_verification.payload_label message_verification.verify_button message_verification.author
message_verification.recovered_key message_verification.matched_authority
message_verification.message_preview message_verification.invalid_signature
sign.sign sign.approve sign.confirm_transaction sign.signing_as sign.selected_account
sign.success_title sign.failure_title sign.error_message sign.transaction_id
sign.signed_with_posting sign.signed_with_active sign.signed_with_owner
sign.mixed_authorities sign.loading_rate
accounts.accounts accounts.unlock accounts.add_another accounts.search accounts.no_passcode
accounts.passcode accounts.remove_failed
import.username import.add_account import.private_key import.passcode
import.protect_with_passcode import.passcode_needed import.invalid_username_password
authorize.authorize authorize.sign_in authorize.signing_in_as authorize.authorizing_as
authorize.scope authorize.scope_login authorize.read_failed authorize.retry
authorize.add_active_key authorize.wrong_passcode authorize.still_confirming
authorize.callback_invalid authorize.callback_insecure
errors.unknown errors.invalid_consent_request report.button about.report_bug index.set_up
common.continue common.cancel login.switch_an_account login.invalid_hs_password
revoke.revoke apps.self_declared sign_buffer.token_refused sign_buffer.refused
footer.sign_message footer.verify_message footer.authorized_apps
summary.keys_none summary.threshold_missing
`
  .trim()
  .split(/\s+/);

const root = process.cwd();
const value = (dict, key) =>
  key.split('.').reduce((at, part) => (at == null ? at : at[part]), dict);

/** Every quoted string a language's docs word differently from its app. */
export function wordingDrift(lang) {
  const info = LANGUAGES.find((l) => l.code === lang);
  if (!info) throw new Error(`${lang}: not a language the app ships`);
  const dir = join(root, 'src', 'docs', lang);
  const strings = JSON.parse(
    readFileSync(
      join(root, 'src', 'i18n', 'locales', `${info.file}.json`),
      'utf8',
    ),
  );
  const docs = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n');
  return QUOTED.filter((key) => {
    const shown = value(strings, key);
    // A placeholder or markup is filled in by the time a page quotes it.
    return shown && !/[{<]/.test(shown) && !docs.includes(shown);
  }).map((key) => ({ key, shown: value(strings, key) }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const docs = join(root, 'src', 'docs');
  let found = 0;
  for (const entry of readdirSync(docs)) {
    if (entry === 'en' || !statSync(join(docs, entry)).isDirectory()) continue;
    for (const { key, shown } of wordingDrift(entry)) {
      console.log(`${entry}: the docs do not quote ${key} as the app words it`);
      console.log(`  app: ${shown}`);
      found += 1;
    }
  }
  console.log(
    found === 0 ? 'Every quoted string matches the app.' : `${found} to fix.`,
  );
  process.exitCode = found === 0 ? 0 : 1;
}

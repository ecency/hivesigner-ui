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
//
// A quote belongs to a page, so that is where it is checked. Reading a whole
// folder as one string would pass a label worded right on one page and wrong
// on the next, and a short word that appears in ordinary prose would cover a
// quote that is wrong everywhere. The English page says WHERE each string is
// quoted, in bold or in quotation marks, and that page of the translation has
// to carry that language's wording of it. Where one English string serves two
// keys ("Sign message" is the button and the footer's page both) either
// wording passes: the English page cannot say which of them it meant.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGUAGES } from '../src/i18n/languages.ts';

/**
 * The keys the docs quote as a label or a whole message.
 *
 * `authority.*` is deliberately absent. Those are ordinary nouns, and a page
 * that lists them under a "Key" column inflects them to agree with it
 * ("klucz publikowania", "ключ владельца"). That is the right wording, not
 * drift, and demanding the app's nominative would make three languages read
 * worse to satisfy a check.
 */
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
accounts.accounts accounts.delete accounts.unlock accounts.add_another accounts.search
accounts.no_passcode
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
authorize.redirect_not_registered authorize.hive_account footer.about
message_signing.title message_verification.title profile.is_app profile.name
profile.profile_pic profile.about profile.website signs.title signs.sign
op_name.transfer op_name.recurrent_transfer op_name.delegate_vesting_shares
op_name.transfer_to_vesting op_name.set_withdraw_vesting_route
op_name.withdraw_vesting op_name.transfer_to_savings
op_name.transfer_from_savings op_name.cancel_transfer_from_savings
op_name.convert op_name.collateralized_convert op_name.account_witness_vote
op_name.witness_update op_name.witness_set_properties
op_name.account_witness_proxy op_name.claim_account op_name.account_create
op_name.create_claimed_account op_name.vote op_name.limit_order_create
op_name.limit_order_create2 op_name.limit_order_cancel
op_name.claim_reward_balance op_name.comment op_name.comment_options
op_name.custom_json op_name.delete_comment op_name.account_update
op_name.account_update2 op_name.change_recovery_account
op_name.create_proposal op_name.remove_proposal op_name.update_proposal_votes
op_name.update_proposal op_name.escrow_transfer op_name.escrow_approve
op_name.escrow_dispute op_name.escrow_release
op_name.account_create_with_delegation op_name.request_account_recovery
op_name.recover_account meta.about meta.sign
`
  .trim()
  .split(/\s+/);

const root = process.cwd();
const docsDir = join(root, 'src', 'docs');
const value = (dict, key) =>
  key.split('.').reduce((at, part) => (at == null ? at : at[part]), dict);

const strings = (lang) => {
  const info = LANGUAGES.find((l) => l.code === lang);
  if (!info) throw new Error(`${lang}: not a language the app ships`);
  return JSON.parse(
    readFileSync(
      join(root, 'src', 'i18n', 'locales', `${info.file}.json`),
      'utf8',
    ),
  );
};

const pagesOf = (lang) =>
  new Map(
    readdirSync(join(docsDir, lang))
      .filter((f) => f.endsWith('.md'))
      .map((f) => [
        f.slice(0, -3),
        readFileSync(join(docsDir, lang, f), 'utf8'),
      ]),
  );

// What a page presents as words the app shows: **Add account**, "Signing as",
// and a table cell that holds nothing else, which is how the pages list the
// operation names and the key each one needs. A label the docs complete with
// an account name is quoted whole.
const SPAN = /\*\*([^*\n]+)\*\*|"([^"\n]+)"/g;
const CELL = /^\|.*\|[ \t]*$/;
const RULE = /^\|[\s:|-]+\|[ \t]*$/;
const quotedIn = (text) => {
  const found = [...text.matchAll(SPAN)].map((m) => m[1] ?? m[2]);
  const lines = text.split('\n');
  for (const [i, line] of lines.entries()) {
    // The heading row of a table names the columns in the writer's own
    // words ("| Message | What it means |"), so it quotes nothing.
    if (!CELL.test(line) || RULE.test(line) || RULE.test(lines[i + 1] ?? ''))
      continue;
    found.push(...line.split('|').slice(1, -1));
  }
  return new Set(
    found.map((s) => s.trim().replace(/\s*@USERNAME$/, '')).filter(Boolean),
  );
};

/** Each English string the docs quote: the keys it belongs to, and the pages
    that quote it. A string no page quotes is looked for in the whole folder. */
function englishQuotes() {
  const english = strings('en');
  const pages = pagesOf('en');
  const quotes = new Map();
  for (const key of QUOTED) {
    const shown = value(english, key);
    // A placeholder or markup is filled in by the time a page quotes it.
    if (!shown || /[{<]/.test(shown)) continue;
    const found = quotes.get(shown) ?? { keys: [], slugs: [] };
    found.keys.push(key);
    if (found.slugs.length === 0)
      found.slugs = [...pages]
        .filter(([, text]) => quotedIn(text).has(shown))
        .map(([slug]) => slug);
    quotes.set(shown, found);
  }
  return quotes;
}

/** Every quoted string a language's docs word differently from its app. */
export function wordingDrift(lang) {
  const theirs = strings(lang);
  const pages = pagesOf(lang);
  const folder = [...pages.values()].join('\n');
  const drift = [];
  for (const [, { keys, slugs }] of englishQuotes()) {
    // Either wording, when one English string stands for two keys.
    const shown = keys
      .map((key) => value(theirs, key))
      .filter((s) => s && !/[{<]/.test(s));
    if (shown.length === 0) continue;
    const where = slugs.filter((slug) => pages.has(slug));
    if (slugs.length === 0) {
      // No English page quotes it: all this can ask is that the docs say it.
      if (!shown.some((s) => folder.includes(s)))
        drift.push({ key: keys[0], shown: shown[0], slug: null });
      continue;
    }
    for (const slug of where) {
      const text = pages.get(slug);
      if (!shown.some((s) => text.includes(s)))
        drift.push({ key: keys[0], shown: shown[0], slug });
    }
  }
  return drift;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let found = 0;
  for (const entry of readdirSync(docsDir)) {
    if (entry === 'en' || !statSync(join(docsDir, entry)).isDirectory())
      continue;
    for (const { key, shown, slug } of wordingDrift(entry)) {
      const where = slug ? `${entry}/${slug}` : entry;
      console.log(`${where}: does not quote ${key} as the app words it`);
      console.log(`  app: ${shown}`);
      found += 1;
    }
  }
  console.log(
    found === 0 ? 'Every quoted string matches the app.' : `${found} to fix.`,
  );
  process.exitCode = found === 0 ? 0 : 1;
}

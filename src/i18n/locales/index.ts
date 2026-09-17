// The dictionaries. English is the source (Crowdin reads en-US.json and writes
// the others) and is bundled, since it is also the fallback for any string a
// translation lacks. Every other language is its own chunk, fetched only by
// someone who uses it.
import type { Language } from '../languages';
import en from './en-US.json';

export type Dictionary = typeof en;

export const english: Dictionary = en;

type Loader = () => Promise<{ default: object }>;

export const loaders: Record<Exclude<Language, 'en'>, Loader> = {
  ar: () => import(/* webpackChunkName: "lang-ar" */ './ar-SA.json'),
  bg: () => import(/* webpackChunkName: "lang-bg" */ './bg-BG.json'),
  bn: () => import(/* webpackChunkName: "lang-bn" */ './bn-BD.json'),
  de: () => import(/* webpackChunkName: "lang-de" */ './de-DE.json'),
  es: () => import(/* webpackChunkName: "lang-es" */ './es-ES.json'),
  fa: () => import(/* webpackChunkName: "lang-fa" */ './fa-IR.json'),
  fr: () => import(/* webpackChunkName: "lang-fr" */ './fr-FR.json'),
  hi: () => import(/* webpackChunkName: "lang-hi" */ './hi-IN.json'),
  id: () => import(/* webpackChunkName: "lang-id" */ './id-ID.json'),
  it: () => import(/* webpackChunkName: "lang-it" */ './it-IT.json'),
  ja: () => import(/* webpackChunkName: "lang-ja" */ './ja-JP.json'),
  ko: () => import(/* webpackChunkName: "lang-ko" */ './ko-KR.json'),
  nl: () => import(/* webpackChunkName: "lang-nl" */ './nl-NL.json'),
  pl: () => import(/* webpackChunkName: "lang-pl" */ './pl-PL.json'),
  pt: () => import(/* webpackChunkName: "lang-pt" */ './pt-BR.json'),
  ru: () => import(/* webpackChunkName: "lang-ru" */ './ru-RU.json'),
  sr: () => import(/* webpackChunkName: "lang-sr" */ './sr-CS.json'),
  th: () => import(/* webpackChunkName: "lang-th" */ './th-TH.json'),
  tr: () => import(/* webpackChunkName: "lang-tr" */ './tr-TR.json'),
  uk: () => import(/* webpackChunkName: "lang-uk" */ './uk-UA.json'),
  uz: () => import(/* webpackChunkName: "lang-uz" */ './uz-UZ.json'),
  vi: () => import(/* webpackChunkName: "lang-vi" */ './vi-VN.json'),
  'zh-CN': () => import(/* webpackChunkName: "lang-zh-CN" */ './zh-CN.json'),
  'zh-TW': () => import(/* webpackChunkName: "lang-zh-TW" */ './zh-TW.json'),
};

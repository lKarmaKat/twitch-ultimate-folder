// Flag artwork for the subset of Twitch broadcast languages (TWITCH_LANGUAGE_CODES
// in constantes.ts) that map to a single national flag. Codes without an entry here
// (e.g. 'zh', 'ar', 'asl', 'other') render label-only in TwitchLanguageSelect.
import enFlag from '../assets/flags/en.svg';
import frFlag from '../assets/flags/fr.svg';
import esFlag from '../assets/flags/es.svg';
import deFlag from '../assets/flags/de.svg';
import itFlag from '../assets/flags/it.svg';
import ptFlag from '../assets/flags/pt_PT.svg';
import ruFlag from '../assets/flags/ru.svg';
import plFlag from '../assets/flags/pl.svg';
import svFlag from '../assets/flags/sv.svg';
import fiFlag from '../assets/flags/fi.svg';
import noFlag from '../assets/flags/no.svg';
import elFlag from '../assets/flags/el.svg';
import bgFlag from '../assets/flags/bg.svg';

export const TWITCH_LANGUAGE_FLAGS = {
  en: enFlag,
  fr: frFlag,
  es: esFlag,
  de: deFlag,
  it: itFlag,
  pt: ptFlag,
  ru: ruFlag,
  pl: plFlag,
  sv: svFlag,
  fi: fiFlag,
  no: noFlag,
  el: elFlag,
  bg: bgFlag,
};

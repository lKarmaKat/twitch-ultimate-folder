// Liste des langues proposees par le selecteur (LanguageSelect.svelte).
// Partagee entre l'action popup et la page d'aide : les ids doivent rester
// alignes sur SUPPORTED_LOCALES dans ./index.ts.
import enFlag from '../assets/flags/en.svg';
import frFlag from '../assets/flags/fr.svg';
import esFlag from '../assets/flags/es.svg';
import deFlag from '../assets/flags/de.svg';
import itFlag from '../assets/flags/it.svg';
import ptBrFlag from '../assets/flags/pt_BR.svg';
import ptPtFlag from '../assets/flags/pt_PT.svg';
import hrFlag from '../assets/flags/hr.svg';
import ruFlag from '../assets/flags/ru.svg';
import plFlag from '../assets/flags/pl.svg';
import svFlag from '../assets/flags/sv.svg';
import fiFlag from '../assets/flags/fi.svg';
import noFlag from '../assets/flags/no.svg';
import elFlag from '../assets/flags/el.svg';
import bgFlag from '../assets/flags/bg.svg';

export const LANGUAGES = [
  { id: 'en', name: 'English', flag: enFlag },
  { id: 'fr', name: 'Français', flag: frFlag },
  { id: 'es', name: 'Español', flag: esFlag },
  { id: 'de', name: 'Deutsch', flag: deFlag },
  { id: 'it', name: 'Italiano', flag: itFlag },
  { id: 'pt_BR', name: 'Português (Brasil)', flag: ptBrFlag },
  { id: 'pt_PT', name: 'Português (Portugal)', flag: ptPtFlag },
  { id: 'hr', name: 'Hrvatski', flag: hrFlag },
  { id: 'ru', name: 'Русский', flag: ruFlag },
  { id: 'pl', name: 'Polski', flag: plFlag },
  { id: 'sv', name: 'Svenska', flag: svFlag },
  { id: 'fi', name: 'Suomi', flag: fiFlag },
  { id: 'no', name: 'Norsk', flag: noFlag },
  { id: 'el', name: 'Ελληνικά', flag: elFlag },
  { id: 'bg', name: 'Български', flag: bgFlag },
];

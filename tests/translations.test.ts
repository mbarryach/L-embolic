import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES, TRANSLATIONS } from '../src/data/translations';

describe('les traduccions comparteixen el mateix contracte', () => {
  it('ofereix català, castellà i anglès', () => {
    expect(SUPPORTED_LOCALES).toEqual(['ca', 'es', 'en']);
  });

  it('cada idioma conté totes les claus i cap valor buit', () => {
    const referenceKeys = Object.keys(TRANSLATIONS.ca).sort();

    for (const locale of SUPPORTED_LOCALES) {
      const dictionary = TRANSLATIONS[locale];
      expect(Object.keys(dictionary).sort()).toEqual(referenceKeys);
      for (const value of Object.values(dictionary)) expect(value.trim().length).toBeGreaterThan(0);
    }
  });
});

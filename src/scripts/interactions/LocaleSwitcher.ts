import { TRANSLATIONS, isLocale, type Locale } from '../../data/translations';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { on, query, queryAll } from '../utils/dom';

const STORAGE_KEY = 'lembolic-locale';
const WHATSAPP_NUMBER = '34649982250';

export class LocaleSwitcher {
  private readonly detachers: (() => void)[] = [];
  private locale: Locale = 'ca';

  constructor() {
    this.locale = this.readInitialLocale();
    this.apply(this.locale);

    for (const button of queryAll<HTMLButtonElement>('[data-locale]')) {
      this.detachers.push(
        on(button, 'click', () => {
          const next = button.dataset.locale;
          if (!isLocale(next) || next === this.locale) return;
          this.apply(next);
          this.persist(next);
        }),
      );
    }
  }

  private readInitialLocale(): Locale {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isLocale(stored)) return stored;
    } catch {
      // El sitio sigue en catalán si el navegador bloquea el almacenamiento.
    }

    const declared = document.documentElement.lang.slice(0, 2).toLowerCase();
    return isLocale(declared) ? declared : 'ca';
  }

  private persist(locale: Locale): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // La preferencia dura la sesión cuando el almacenamiento no está disponible.
    }
  }

  private apply(locale: Locale): void {
    const dictionary = TRANSLATIONS[locale];
    this.locale = locale;
    document.documentElement.lang = locale;
    document.documentElement.dataset.currentLocale = locale;
    document.title = dictionary.page_title ?? document.title;

    const description = query<HTMLMetaElement>('meta[name="description"]');
    if (description && dictionary.page_description)
      description.content = dictionary.page_description;

    for (const element of queryAll('[data-i18n]')) {
      const key = element.dataset.i18n;
      if (key && dictionary[key]) element.textContent = dictionary[key];
    }

    for (const element of queryAll('[data-i18n-aria-label]')) {
      const key = element.dataset.i18nAriaLabel;
      if (key && dictionary[key]) element.setAttribute('aria-label', dictionary[key]);
    }

    for (const image of queryAll<HTMLImageElement>('[data-i18n-alt]')) {
      const key = image.dataset.i18nAlt;
      if (key && dictionary[key]) image.alt = dictionary[key];
    }

    for (const button of queryAll<HTMLButtonElement>('[data-locale]')) {
      const active = button.dataset.locale === locale;
      button.setAttribute('aria-pressed', String(active));
      button.dataset.active = String(active);
    }

    const menuLabel = query('[data-menu-label]');
    if (menuLabel) {
      const openLabel = dictionary.menu_close ?? 'Tanca';
      const closedLabel = dictionary.menu_open ?? 'Menú';
      menuLabel.dataset.labelOpen = openLabel;
      menuLabel.dataset.labelClosed = closedLabel;
      const expanded =
        query<HTMLButtonElement>('[data-menu-toggle]')?.getAttribute('aria-expanded') === 'true';
      menuLabel.textContent = expanded ? openLabel : closedLabel;
    }

    const loaderStatus = query('[data-loader-status]');
    if (loaderStatus && dictionary.loader_ready) {
      loaderStatus.dataset.readyLabel = dictionary.loader_ready;
    }

    const whatsappMessage = dictionary.whatsapp_message ?? '';
    for (const link of queryAll<HTMLAnchorElement>('[data-whatsapp]')) {
      link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
    }

    window.dispatchEvent(new CustomEvent('localechange', { detail: { locale } }));
    window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  }

  destroy(): void {
    for (const detach of this.detachers) detach();
    this.detachers.length = 0;
  }
}

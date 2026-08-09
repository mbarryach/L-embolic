import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { query } from '../utils/dom';

export class ContactDock {
  private trigger: ScrollTrigger | null = null;

  constructor() {
    const dock = query('[data-contact-dock]');
    const hero = query('.hero');
    if (!dock || !hero) return;

    this.trigger = ScrollTrigger.create({
      trigger: hero,
      start: 'bottom 78%',
      end: 99999,
      onToggle: (self) => {
        dock.dataset.visible = String(self.isActive);
      },
    });
  }

  destroy(): void {
    this.trigger?.kill();
    this.trigger = null;
  }
}

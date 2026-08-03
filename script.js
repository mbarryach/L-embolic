// ---------- build bunting flags ----------
const flagColors = ['#ff6e6b', '#e8b94a', '#4dd9e8', '#8fbf9f', '#f2e9dc'];
const flagsWrap = document.querySelector('.flags');
const FLAG_COUNT = 30;
for (let i = 0; i < FLAG_COUNT; i++) {
  const flag = document.createElement('div');
  flag.className = 'flag';
  flag.style.background = flagColors[i % flagColors.length];
  flagsWrap.appendChild(flag);
}

// ---------- GSAP setup ----------
gsap.registerPlugin(ScrollTrigger);

// gentle sway on the bunting string
gsap.to('.flags', {
  rotation: 1.2,
  transformOrigin: 'top center',
  duration: 2.4,
  ease: 'sine.inOut',
  yoyo: true,
  repeat: -1
});
gsap.utils.toArray('.flag').forEach((flag, i) => {
  gsap.to(flag, {
    rotation: (i % 2 === 0 ? 6 : -6),
    duration: 1.8 + (i % 5) * 0.15,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    delay: i * 0.05
  });
});

// ---------- hero load-in sequence ----------
const heroTl = gsap.timeline({ defaults: { ease: 'power2.out' } });

heroTl
  .set('.neon-text, .neon-figure', { opacity: 0 })
  .to('.neon-text', { opacity: 1, duration: 0.15 })
  .to('.neon-text', { opacity: 0.2, duration: 0.08 })
  .to('.neon-text', { opacity: 1, duration: 0.08 })
  .to('.neon-text', { opacity: 0.3, duration: 0.06 })
  .to('.neon-text', { opacity: 1, duration: 0.3 })
  .to('.neon-figure', { opacity: 1, duration: 0.5 }, '-=0.2')
  .from('.hero-tagline', { y: 16, opacity: 0, duration: 0.5 }, '-=0.2')
  .from('.hero-sub', { y: 16, opacity: 0, duration: 0.5 }, '-=0.3')
  .from('.hero-cta .btn', { y: 16, opacity: 0, duration: 0.4, stagger: 0.12 }, '-=0.3');

// subtle ambient flicker loop after intro (like a slightly imperfect neon tube)
gsap.to('.neon-text, .neon-figure', {
  opacity: 0.92,
  duration: 0.12,
  repeat: -1,
  repeatDelay: 4,
  yoyo: true,
  delay: 3
});

// ---------- scroll reveals ----------
gsap.utils.toArray('.split').forEach((section) => {
  gsap.from(section.querySelectorAll('.split-text > *'), {
    scrollTrigger: { trigger: section, start: 'top 75%' },
    y: 24,
    opacity: 0,
    duration: 0.6,
    stagger: 0.1,
    ease: 'power2.out'
  });
  gsap.from(section.querySelector('.split-art'), {
    scrollTrigger: { trigger: section, start: 'top 75%' },
    scale: 0.92,
    opacity: 0,
    duration: 0.6,
    ease: 'power2.out'
  });
});

gsap.from('.carta .eyebrow, .carta h2', {
  scrollTrigger: { trigger: '.carta', start: 'top 70%' },
  y: 20,
  opacity: 0,
  duration: 0.5,
  stagger: 0.1
});

gsap.utils.toArray('.card').forEach((card, i) => {
  const baseRotation = getComputedStyle(card).transform;
  gsap.from(card, {
    scrollTrigger: { trigger: card, start: 'top 88%' },
    y: 40,
    opacity: 0,
    rotation: 0,
    duration: 0.55,
    delay: (i % 3) * 0.08,
    ease: 'back.out(1.4)'
  });
});

gsap.from('.carta-note', {
  scrollTrigger: { trigger: '.carta-note', start: 'top 90%' },
  opacity: 0,
  y: 10,
  duration: 0.5
});

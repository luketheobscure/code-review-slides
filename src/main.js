import Reveal from 'reveal.js';
import RevealNotes from 'reveal.js/plugin/notes';
import 'reveal.js/reset.css';
import 'reveal.js/reveal.css';
import 'reveal.js/theme/black.css';
import './styles/custom.css';
import { createToC } from './toc.js';
import { createThemedPipe } from './past-future.js';

import s00 from './slides/00-intro.html?raw';
import s01 from './slides/01-rock.html?raw';
import s02 from './slides/02-magic.html?raw';
import s03 from './slides/03-gfm-logo.html?raw';
import s04 from './slides/04-mission.html?raw';
import s05 from './slides/05-sloppocalypse.html?raw';
import s06 from './slides/06-prompt2prod.html?raw';
import s06b from './slides/06b-arcades-intro.html?raw';
import s07 from './slides/07-arcades-inaction.html?raw';
import s08 from './slides/08-arcades-future.html?raw';
import s09 from './slides/13-toc-theory.html?raw';
import s10 from './slides/14-toc-subtle.html?raw';
import s11 from './slides/15-toc-codereview.html?raw';
import s12 from './slides/14b-spicy-take.html?raw';
import s13 from './slides/17-bridge.html?raw';
import s14 from './slides/18-two-approaches.html?raw';
import s15 from './slides/19-foundations.html?raw';
import s16 from './slides/20-own-code.html?raw';
import s17b from './slides/21b-responsibilities.html?raw';
import s17c from './slides/21c-stacked-changes.html?raw';
import s17d from './slides/21d-share-responsibility.html?raw';
import s17e from './slides/21e-understand-requirements.html?raw';
import s18 from './slides/22-ai-review-guardrails.html?raw';
import s19 from './slides/23-change-classification.html?raw';
import s20 from './slides/24-verification.html?raw';
import s21 from './slides/25-whole-system.html?raw';
import s22 from './slides/26-closing.html?raw';
import s23 from './slides/27-incentivize-review.html?raw';
import s24 from './slides/28-gen-review-bar.html?raw';
import s25 from './slides/29-summary.html?raw';

const slides = [
  s00, s01, s02, s03, s04, s05, s06, s06b, s07, s08, s09,
  s10, s11, s12, s13, s14, s15, s16, s17d, s17b, s17c, s17e, s23,
  s18, s19, s20, s21, s24,
  s25, s22,
];

document.querySelector('.slides').innerHTML = slides.join('\n');

const TOC_VARIANT_CONFIG = {
  theory:     { initialConstrained: true, initialShowSDLC: false, initialSpawnMs: 300, prefillCount: 0,  narrowRadius: 22, showConstraintMarker: true,  spawnPerCycle: 3 },
  subtle:     { initialConstrained: true, initialShowSDLC: false, initialSpawnMs: 140, prefillCount: 0,  narrowRadius: 56, showConstraintMarker: false, spawnPerCycle: 1 },
  codereview: { initialConstrained: true, initialShowSDLC: false, initialSpawnMs: 60,  prefillCount: 0,  narrowRadius: 22, showConstraintMarker: false, spawnPerCycle: 1, leftWideRadius: 115, constraintLabel: '◆  CODE REVIEW' },
};

const tocControllers = new Map();
const pfControllers  = new Map();

Reveal.initialize({
  hash: true,
  controls: false,
  slideNumber: false,
  showNotes: false,
  transition: 'none',
  backgroundTransition: 'none',
  width: 1280,
  height: 720,
  margin: 0,
  maxScale: 4,
  plugins: [RevealNotes],
}).then(() => {
  const ufoSvg = `<svg viewBox="0 0 64 28" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="32" cy="11" rx="9" ry="6" fill="#ff7bf0" opacity="0.78"/>
    <ellipse cx="32" cy="9.5" rx="5" ry="2.5" fill="#ffd0fa" opacity="0.85"/>
    <ellipse cx="32" cy="16" rx="28" ry="4.5" fill="#67e8f9" opacity="0.55"/>
    <ellipse cx="32" cy="15.5" rx="24" ry="2.5" fill="#c5f0fa" opacity="0.5"/>
    <circle cx="18" cy="19" r="1.1" fill="#ffd97a"/>
    <circle cx="32" cy="19.6" r="1.1" fill="#ff7bf0"/>
    <circle cx="46" cy="19" r="1.1" fill="#67e8f9"/>
  </svg>`;
  document.querySelectorAll('section.future-theme').forEach(section => {
    if (section.querySelector('.future-ufo')) return;
    const ufo = document.createElement('div');
    ufo.className = 'future-ufo';
    ufo.setAttribute('aria-hidden', 'true');
    ufo.innerHTML = ufoSvg;
    section.appendChild(ufo);
  });

  document.querySelectorAll('section[data-slide="past-future"]').forEach(section => {
    const controllers = [];
    section.querySelectorAll('canvas[data-pf-theme]').forEach(canvas => {
      const ctrl = createThemedPipe(canvas, canvas.dataset.pfTheme);
      ctrl.init();
      controllers.push(ctrl);
    });
    pfControllers.set(section, controllers);
  });

  document.querySelectorAll('section[data-toc-variant]').forEach(section => {
    const variant = section.dataset.tocVariant;
    const config = TOC_VARIANT_CONFIG[variant];
    if (!config) return;
    const canvas = section.querySelector('.toc-canvas');
    if (!canvas) return;
    const controller = createToC({
      canvas,
      refs: {
        tp: section.querySelector('.stat-tp'),
        q:  section.querySelector('.stat-q'),
        in: section.querySelector('.stat-in'),
      },
      ...config,
    });
    controller.init();
    tocControllers.set(section, { controller, config });
  });

  Reveal.on('slidechanged', ({ currentSlide }) => {
    const pf = pfControllers.get(currentSlide);
    if (pf) pf.forEach(c => c.reset());

    const entry = tocControllers.get(currentSlide);
    if (entry) entry.controller.reset();
  });

  function applyFragment(fragment, on) {
    const action = fragment.dataset.tocAction;
    if (!action) return;
    const section = fragment.closest('section[data-toc-variant]');
    const entry   = tocControllers.get(section);
    if (!entry) return;
    if (action === 'label-constraint') entry.controller.setShowConstraintMarker(on);
  }
  Reveal.on('fragmentshown',  ({ fragment }) => applyFragment(fragment, true));
  Reveal.on('fragmenthidden', ({ fragment }) => applyFragment(fragment, false));
});

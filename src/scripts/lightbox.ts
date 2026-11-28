import { allowCanvasCors } from '../types/photos';
import type { WallPhoto } from '../types/wall';

/**
 * Folio viewer: the clicked frame flies from its spot on the wall to the
 * centre of the screen (FLIP), then upgrades to the full-size file.
 */

interface OpenOptions {
  /** Where the frame currently sits on screen — the FLIP origin. */
  rect?: DOMRect;
  /** Already-loaded URL for an instant first paint. */
  src?: string;
  returnFocus?: HTMLElement | null;
}

interface Els {
  root: HTMLElement;
  stage: HTMLElement;
  img: HTMLImageElement;
  count: HTMLElement;
  title: HTMLElement;
  alt: HTMLElement;
  album: HTMLAnchorElement;
  prev: HTMLButtonElement;
  next: HTMLButtonElement;
  close: HTMLButtonElement;
}

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

type LoupeRect = { left: number; top: number; width: number; height: number };

/** Park the loupe using the lightbox *layout* rect (not FLIP visual bounds). */
function notifyLoupe(open: boolean, rect?: LoupeRect) {
  window.dispatchEvent(new CustomEvent('preview-loupe:lightbox', { detail: { open, rect } }));
}

let state: {
  photos: WallPhoto[];
  index: number;
  returnFocus: HTMLElement | null;
  els: Els;
  ac: AbortController;
  busy: boolean;
} | null = null;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n: number) => String(n).padStart(2, '0');

function query(): Els | null {
  const root = document.querySelector<HTMLElement>('[data-lb]');
  if (!root) return null;
  const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel) as T;
  return {
    root,
    stage: $('[data-lb-stage]'),
    img: $('[data-lb-img]'),
    count: $('[data-lb-count]'),
    title: $('[data-lb-title]'),
    alt: $('[data-lb-alt]'),
    album: $('[data-lb-album]'),
    prev: $('[data-lb-prev]'),
    next: $('[data-lb-next]'),
    close: $('[data-lb-close-btn]'),
  };
}

function targetRect(photo: WallPhoto) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mobile = vw < 640;
  const side = mobile ? 12 : 40;
  const top = mobile ? 64 : 40;
  const bottom = mobile ? 148 : 112;
  const availW = vw - side * 2;
  const availH = Math.max(120, vh - top - bottom);
  const aspect = photo.w > 0 && photo.h > 0 ? photo.w / photo.h : 1.5;
  let w = Math.min(availW, availH * aspect);
  let h = w / aspect;
  if (h > availH) {
    h = availH;
    w = h * aspect;
  }
  return { left: (vw - w) / 2, top: top + (availH - h) / 2, width: w, height: h };
}

function place(els: Els, photo: WallPhoto) {
  const r = targetRect(photo);
  Object.assign(els.img.style, {
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
  });
  return r;
}

function caption(els: Els, photos: WallPhoto[], index: number) {
  const photo = photos[index];
  els.count.textContent = `${pad(index + 1)} / ${pad(photos.length)}`;
  els.title.textContent = photo.album?.title ?? 'Archivo';
  els.alt.textContent = photo.alt;
  els.img.alt = photo.alt;

  const here = window.location.pathname.replace(/\/$/, '') || '/';
  const showAlbum = !!photo.album && photo.album.href !== here;
  els.album.hidden = !showAlbum;
  if (photo.album) {
    els.album.href = photo.album.href;
    els.album.querySelector('span')!.textContent = `Ver ${photo.album.title}`;
  }
  const many = photos.length > 1;
  els.prev.hidden = !many;
  els.next.hidden = !many;
}

/** Swap to the full-size file once decoded; measure unsized R2 frames. */
function upgrade(photo: WallPhoto, index: number) {
  const full = new Image();
  full.decoding = 'async';
  allowCanvasCors(full, photo.full);
  full.src = photo.full;
  full
    .decode()
    .then(() => {
      if (!state || state.index !== index || state.photos[index] !== photo) return;
      if (!photo.sized && full.naturalWidth && full.naturalHeight) {
        photo.w = full.naturalWidth;
        photo.h = full.naturalHeight;
        photo.sized = true;
        const before = state.els.img.getBoundingClientRect();
        const after = place(state.els, photo);
        if (!reduced()) {
          state.els.img.animate(
            [
              {
                transform: `translate(${before.left - after.left}px, ${before.top - after.top}px) scale(${before.width / after.width}, ${before.height / after.height})`,
              },
              { transform: 'none' },
            ],
            { duration: 450, easing: EASE },
          );
        }
        notifyLoupe(true, after);
      }
      setSrc(state.els, photo.full);
    })
    .catch(() => {
      /* keep the display-size file */
    });
}

/** Point the viewer at a new file; hide the stale frame until it arrives. */
function setSrc(els: Els, src: string) {
  els.root.classList.remove('is-loading');
  els.root.removeAttribute('aria-busy');
  if (els.img.getAttribute('src') === src && els.img.complete) return;
  allowCanvasCors(els.img, src);
  els.img.src = src;
  if (els.img.complete && els.img.naturalWidth) return;
  els.root.classList.add('is-loading');
  els.root.setAttribute('aria-busy', 'true');
  const done = () => {
    if (els.img.getAttribute('src') === src) {
      els.root.classList.remove('is-loading');
      els.root.removeAttribute('aria-busy');
    }
  };
  els.img.addEventListener('load', done, { once: true });
  els.img.addEventListener('error', done, { once: true });
}

function preloadNeighbours() {
  if (!state) return;
  const { photos, index } = state;
  for (const d of [1, -1]) {
    const p = photos[(index + d + photos.length) % photos.length];
    if (p) {
      const tip = new Image();
      allowCanvasCors(tip, p.full);
      tip.src = p.full;
    }
  }
}

function show(index: number, opts: OpenOptions = {}) {
  if (!state) return;
  const { els, photos } = state;
  state.index = index;
  const photo = photos[index];
  caption(els, photos, index);
  setSrc(els, opts.src || photo.src);
  const r = place(els, photo);

  if (opts.rect && !reduced()) {
    const o = opts.rect;
    els.img.animate(
      [
        {
          transform: `translate(${o.left - r.left}px, ${o.top - r.top}px) scale(${o.width / r.width}, ${o.height / r.height})`,
        },
        { transform: 'none' },
      ],
      { duration: 720, easing: EASE },
    );
  }
  upgrade(photo, index);
  preloadNeighbours();
  // Pass layout rect — getBoundingClientRect would still be on the wall tile during FLIP.
  notifyLoupe(true, r);
}

/** Resolve when an animation ends — or is cancelled — without throwing. */
const settle = (a: Animation) =>
  a.finished.then(
    () => undefined,
    () => undefined,
  );

async function go(delta: number) {
  if (!state || state.busy || state.photos.length < 2) return;
  const current = state;
  current.busy = true;
  const { els, photos } = current;
  const next = (current.index + delta + photos.length) % photos.length;

  if (!reduced()) {
    els.img.getAnimations().forEach((a) => a.cancel());
    const out = els.img.animate(
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: `translateX(${-delta * 28}px)` },
      ],
      { duration: 170, easing: 'ease-in' },
    );
    // Hold the hidden state with inline styles rather than a fill mode.
    els.img.style.opacity = '0';
    await settle(out);
  }
  if (state !== current) return;

  show(next);

  if (!reduced()) {
    const inn = els.img.animate(
      [
        { opacity: 0, transform: `translateX(${delta * 28}px)` },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 420, easing: EASE },
    );
    els.img.style.opacity = '';
    await settle(inn);
  }
  els.img.style.opacity = '';
  current.busy = false;
}

function trapFocus(e: KeyboardEvent, root: HTMLElement) {
  const focusables = [
    ...root.querySelectorAll<HTMLElement>('button:not([hidden]), a[href]:not([hidden])'),
  ].filter((el) => el.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

export function closeLightbox(immediate = false) {
  if (!state) return;
  const { els, returnFocus, ac } = state;
  state = null;
  ac.abort();
  els.root.classList.remove('is-open');
  document.documentElement.classList.remove('lb-open');
  notifyLoupe(false);

  const finish = () => {
    if (state) return; // re-opened while the exit animation was running
    els.root.hidden = true;
    els.img.removeAttribute('src');
    els.img.getAnimations().forEach((a) => a.cancel());
    els.img.style.opacity = '';
    returnFocus?.focus({ preventScroll: true });
  };
  if (immediate || reduced()) return finish();
  els.img.getAnimations().forEach((a) => a.cancel());
  const out = els.img.animate(
    [
      { opacity: 1, transform: 'none' },
      { opacity: 0, transform: 'scale(0.96)' },
    ],
    { duration: 260, easing: 'ease-in' },
  );
  els.img.style.opacity = '0';
  settle(out).then(finish);
}

export function openLightbox(photos: WallPhoto[], index: number, opts: OpenOptions = {}) {
  const els = query();
  if (!els || !photos.length) return;
  if (state) closeLightbox(true);

  const ac = new AbortController();
  state = {
    photos,
    index,
    returnFocus: opts.returnFocus ?? (document.activeElement as HTMLElement | null),
    els,
    ac,
    busy: false,
  };

  els.root.hidden = false;
  document.documentElement.classList.add('lb-open');
  els.img.getAnimations().forEach((a) => a.cancel());
  els.img.style.opacity = '';
  show(index, opts);
  requestAnimationFrame(() => els.root.classList.add('is-open'));
  els.close.focus({ preventScroll: true });

  const { signal } = ac;
  els.prev.addEventListener('click', () => go(-1), { signal });
  els.next.addEventListener('click', () => go(1), { signal });
  els.root
    .querySelectorAll('[data-lb-close]')
    .forEach((el) => el.addEventListener('click', () => closeLightbox(), { signal }));
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab') trapFocus(e, els.root);
    },
    { signal },
  );
  els.root.addEventListener('wheel', (e) => e.preventDefault(), { signal, passive: false });
  window.addEventListener(
    'resize',
    () => {
      if (state) place(state.els, state.photos[state.index]);
    },
    { signal },
  );

  // Swipe between frames on touch screens.
  let x0 = 0;
  let y0 = 0;
  let tracking = false;
  els.stage.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === 'mouse') return;
      tracking = true;
      x0 = e.clientX;
      y0 = e.clientY;
    },
    { signal },
  );
  els.stage.addEventListener(
    'pointerup',
    (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      else if (dy > 90) closeLightbox();
    },
    { signal },
  );
  els.stage.addEventListener(
    'click',
    (e) => {
      if (e.target === els.stage) closeLightbox();
    },
    { signal },
  );
}

document.addEventListener('astro:before-swap', () => closeLightbox(true));

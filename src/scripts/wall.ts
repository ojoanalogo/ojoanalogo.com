import { allowCanvasCors } from '../types/photos';
import type { WallPhoto } from '../types/wall';

/**
 * Proximity wall — an endless, pannable plane of photographs.
 *
 * A staggered grid of tiles lives on a torus slightly larger than the
 * viewport. Panning moves the plane; tiles that leave one edge re-enter on the
 * opposite side and, because every tile tracks which *virtual* cell it is
 * showing, they pick a fresh photo as they wrap — so the plane never visibly
 * repeats as long as the archive is larger than one screen.
 *
 * Each frame, a tile's scale is driven by its distance to the focal point
 * (viewport centre, nudged toward the pointer): frames bloom as they approach
 * the middle and recede toward the edges.
 */

export interface WallOptions {
  variant: 'full' | 'contained';
  /** Pan the plane slowly on its own (used by the contained About wall). */
  drift?: boolean;
  /** Translate wheel/trackpad gestures into panning. */
  captureWheel?: boolean;
  onOpen?: (photoIndex: number, rect: DOMRect, src: string) => void;
  onMove?: (x: number, y: number) => void;
}

interface Tile {
  el: HTMLDivElement;
  img: HTMLImageElement;
  capLabel: HTMLSpanElement;
  capNum: HTMLSpanElement;
  col: number;
  row: number;
  /** Position on the plane relative to the plane's centre, at zero offset. */
  gx: number;
  gy: number;
  /** Virtual cell currently shown (changes as the tile wraps). */
  vc: number;
  vr: number;
  photo: number;
  w: number;
  h: number;
  requested: boolean;
  delay: number;
  sx: number;
  sy: number;
  s: number;
}

/** Soft proximity bloom — enough depth without tiles pulsing as you move. */
const MIN_SCALE = 0.92;
const MAX_SCALE = 1.1;
const INTRO_MS = 950;
const DRAG_THRESHOLD = 5;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const mod = (v: number, n: number) => ((v % n) + n) % n;

export const wallRegistry = new WeakMap<HTMLElement, ProximityWall>();

/**
 * Photo index for virtual cell (c, r) is `(c + r * step) mod n`. Repeats of a
 * frame then sit on a lattice; pick the step whose nearest repeat is farthest
 * away on the staggered grid (rows are offset by half a column and spaced at
 * ~0.665 of a column).
 */
function spreadStep(n: number) {
  if (n < 3) return 1;
  let best = 1;
  let bestScore = -1;
  for (let s = 1; s < n; s++) {
    let nearest = Infinity;
    for (let dr = -10; dr <= 10; dr++) {
      for (let dc = -14; dc <= 14; dc++) {
        if ((!dr && !dc) || mod(dc + dr * s, n) !== 0) continue;
        const off = dr % 2 ? 0.5 : 0;
        const dx = Math.min(Math.abs(dc + off), Math.abs(dc - off));
        nearest = Math.min(nearest, Math.hypot(dx, dr * 0.665));
      }
    }
    if (nearest > bestScore) {
      bestScore = nearest;
      best = s;
    }
  }
  return best;
}

export class ProximityWall {
  readonly photos: WallPhoto[];
  private readonly root: HTMLElement;
  private readonly layer: HTMLElement;
  private readonly cursor: HTMLElement | null;
  private readonly opts: WallOptions;
  private readonly ac = new AbortController();
  private readonly ro: ResizeObserver;
  private io: IntersectionObserver | null = null;

  private tiles: Tile[] = [];
  private aspects: number[];
  private step = 1;

  private cols = 0;
  private rows = 0;
  private colStep = 0;
  private rowStep = 0;
  private baseH = 0;
  private worldW = 1;
  private worldH = 1;
  private vw = 0;
  private vh = 0;
  private halfDiag = 1;

  private cur = { x: 0, y: 0 };
  private target = { x: 0, y: 0 };
  private focus = { x: 0, y: 0 };
  private focusTarget = { x: 0, y: 0 };
  private cursorPos = { x: 0, y: 0, tx: 0, ty: 0, on: false };

  private drag: {
    id: number;
    x0: number;
    y0: number;
    lx: number;
    ly: number;
    lt: number;
    vx: number;
    vy: number;
    active: boolean;
  } | null = null;
  private suppressClick = false;

  private raf = 0;
  private lastT = 0;
  private introStart = 0;
  private introDone = false;
  private paused = false;
  private inView = true;
  private resizeTimer = 0;
  private readonly reduced: boolean;
  private readonly finePointer: boolean;

  constructor(root: HTMLElement, photos: WallPhoto[], opts: WallOptions) {
    this.root = root;
    this.photos = photos;
    this.opts = opts;
    this.layer = root.querySelector<HTMLElement>('[data-wall-layer]') ?? root;
    this.cursor = root.querySelector<HTMLElement>('[data-wall-cursor]');
    this.aspects = photos.map((p) => (p.w > 0 && p.h > 0 ? p.w / p.h : 1.5));
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    this.step = spreadStep(photos.length);

    this.introDone = this.reduced; // must be set before build() hides tiles
    this.measure();
    this.build();
    this.introStart = performance.now();
    root.classList.add('is-ready');

    this.bind();
    this.ro = new ResizeObserver(() => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.relayout(), 120);
    });
    this.ro.observe(root);

    if (opts.variant === 'contained') {
      this.io = new IntersectionObserver(([entry]) => {
        this.inView = entry?.isIntersecting ?? true;
        if (this.inView) this.kick();
      });
      this.io.observe(root);
    }

    wallRegistry.set(root, this);
    this.kick();
  }

  /* ------------------------------------------------------------------ */
  /* Layout                                                              */
  /* ------------------------------------------------------------------ */

  private measure() {
    const rect = this.root.getBoundingClientRect();
    this.vw = Math.max(1, rect.width);
    this.vh = Math.max(1, rect.height);
    this.halfDiag = Math.hypot(this.vw, this.vh) / 2;

    if (this.opts.variant === 'contained') {
      this.colStep = clamp(this.vw * 0.46, 150, 280);
      this.baseH = this.colStep * 0.36;
    } else {
      this.colStep = clamp(this.vw * 0.3, 260, 520);
      this.baseH = clamp(this.colStep * 0.4, 110, 200);
    }
    this.rowStep = this.colStep * 0.665;

    this.cols = Math.ceil(this.vw / this.colStep) + 3;
    this.rows = Math.ceil(this.vh / this.rowStep) + 3;
    if (this.rows % 2) this.rows += 1; // keep the stagger consistent across the seam
    this.worldW = this.cols * this.colStep;
    this.worldH = this.rows * this.rowStep;

    this.focus.x = this.focusTarget.x = this.vw / 2;
    this.focus.y = this.focusTarget.y = this.vh / 2;
  }

  private photoFor(vc: number, vr: number) {
    return mod(vc + vr * this.step, this.photos.length);
  }

  private build() {
    this.layer.replaceChildren();
    this.tiles = [];
    const frag = document.createDocumentFragment();

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const el = document.createElement('div');
        el.className = 'wall-tile';
        el.setAttribute('aria-hidden', 'true');
        const img = document.createElement('img');
        img.alt = '';
        img.decoding = 'async';
        img.draggable = false;
        const cap = document.createElement('span');
        cap.className = 'wall-cap';
        const capLabel = document.createElement('span');
        capLabel.className = 'wall-cap-label';
        const capNum = document.createElement('span');
        capNum.className = 'wall-cap-num';
        cap.append(capLabel, capNum);
        el.append(img, cap);
        frag.append(el);

        const gx = (col - this.cols / 2) * this.colStep + (row % 2 ? this.colStep / 2 : 0);
        const gy = (row - this.rows / 2) * this.rowStep;
        const tile: Tile = {
          el,
          img,
          capLabel,
          capNum,
          col,
          row,
          gx,
          gy,
          vc: Number.NaN,
          vr: Number.NaN,
          photo: -1,
          w: 0,
          h: 0,
          requested: false,
          delay: 0,
          sx: 0,
          sy: 0,
          s: 1,
        };
        const d = Math.hypot(gx, gy) / this.halfDiag;
        tile.delay = 80 + d * 520 + Math.random() * 90;
        if (!this.introDone) el.style.opacity = '0';
        tile.h = this.baseH;
        el.style.height = `${this.baseH}px`;
        this.tiles.push(tile);
      }
    }

    for (const tile of this.tiles) {
      tile.img.addEventListener('load', () => this.onTileLoad(tile), { signal: this.ac.signal });
    }

    this.layer.append(frag);
  }

  /**
   * First load of an unsized (R2) frame tells us its real aspect ratio. The
   * viewer may have measured it first, so always reconcile with the record.
   */
  private onTileLoad(tile: Tile) {
    tile.el.classList.add('is-loaded');
    const p = this.photos[tile.photo];
    if (!p) return;
    const { naturalWidth: w, naturalHeight: h } = tile.img;
    if (!p.sized && w && h) {
      p.w = w;
      p.h = h;
      p.sized = true;
    }
    const aspect = p.w > 0 && p.h > 0 ? p.w / p.h : 1.5;
    if (Math.abs(aspect - (this.aspects[tile.photo] ?? 0)) < 0.005) return;
    this.aspects[tile.photo] = aspect;
    for (const t of this.tiles) if (t.photo === tile.photo) this.sizeTile(t);
    this.kick();
  }

  private sizeTile(t: Tile) {
    // Size by long edge so portraits aren't skinny stamps next to landscapes.
    const aspect = this.aspects[t.photo] ?? 1.5;
    const long = this.baseH * 1.5;
    if (aspect >= 1) {
      t.w = long;
      t.h = long / aspect;
    } else {
      t.h = long;
      t.w = long * aspect;
    }
    t.el.style.width = `${t.w}px`;
    t.el.style.height = `${t.h}px`;
    t.s = Number.NaN; // force a transform write next frame (size changed)
  }

  private assign(t: Tile, vc: number, vr: number) {
    t.vc = vc;
    t.vr = vr;
    const photo = this.photoFor(vc, vr);
    if (photo === t.photo) return;
    t.photo = photo;
    t.requested = false;
    t.el.classList.remove('is-loaded');
    t.img.removeAttribute('srcset');
    t.img.removeAttribute('src');
    t.el.dataset.photo = String(photo);
    const p = this.photos[photo];
    t.capLabel.textContent = p?.album?.title ?? p?.alt ?? '';
    t.capNum.textContent = String(photo + 1).padStart(2, '0');
    this.sizeTile(t);
  }

  private request(t: Tile) {
    const p = this.photos[t.photo];
    if (!p) return;
    t.requested = true;
    // R2 frames must be CORS-enabled or the loupe canvas taints on sample.
    allowCanvasCors(t.img, p.src);
    if (p.srcset) {
      t.img.sizes = `${Math.ceil(Math.max(t.w, t.h) * MAX_SCALE)}px`;
      t.img.srcset = p.srcset;
    }
    t.img.src = p.src;
  }

  private relayout() {
    const { cols, rows } = this;
    const prevW = this.vw;
    const prevH = this.vh;
    this.measure();
    if (cols !== this.cols || rows !== this.rows) {
      this.build();
    } else {
      for (const t of this.tiles) {
        t.gx = (t.col - this.cols / 2) * this.colStep + (t.row % 2 ? this.colStep / 2 : 0);
        t.gy = (t.row - this.rows / 2) * this.rowStep;
        if (t.photo >= 0) this.sizeTile(t);
      }
    }
    if (prevW !== this.vw || prevH !== this.vh) this.kick();
  }

  /* ------------------------------------------------------------------ */
  /* Input                                                               */
  /* ------------------------------------------------------------------ */

  private bind() {
    const { signal } = this.ac;
    const root = this.root;

    root.addEventListener('pointerdown', (e) => this.onDown(e), { signal });
    root.addEventListener('pointermove', (e) => this.onMove(e), { signal });
    root.addEventListener('pointerup', (e) => this.onUp(e), { signal });
    root.addEventListener('pointercancel', (e) => this.onUp(e), { signal });
    root.addEventListener(
      'pointerleave',
      () => {
        this.focusTarget.x = this.vw / 2;
        this.focusTarget.y = this.vh / 2;
        this.hideCursor();
        this.kick();
      },
      { signal },
    );
    root.addEventListener('click', (e) => this.onClick(e), { signal });
    root.addEventListener('keydown', (e) => this.onKey(e), { signal });
    root.addEventListener('dragstart', (e) => e.preventDefault(), { signal });
    root.addEventListener('focus', () => this.markCentre(true), { signal });
    root.addEventListener('blur', () => this.markCentre(false), { signal });

    if (this.opts.captureWheel !== false) {
      root.addEventListener(
        'wheel',
        (e) => {
          e.preventDefault();
          if (e.ctrlKey) return; // pinch-zoom gesture: ignore
          const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? this.vh : 1;
          let dx = e.deltaX * unit;
          let dy = e.deltaY * unit;
          if (e.shiftKey && !dx) [dx, dy] = [dy, 0];
          this.target.x -= dx;
          this.target.y -= dy;
          this.kick();
        },
        { signal, passive: false },
      );
    }

    document.addEventListener(
      'visibilitychange',
      () => {
        if (!document.hidden) this.kick();
      },
      { signal },
    );
  }

  private onDown(e: PointerEvent) {
    if (e.button !== 0 || this.paused) return;
    if (document.querySelector('[data-preview-loupe]')?.classList.contains('is-held')) return;
    if ((e.target as HTMLElement | null)?.closest?.('[data-preview-loupe]')) return;
    this.suppressClick = false;
    this.drag = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      lx: e.clientX,
      ly: e.clientY,
      lt: e.timeStamp,
      vx: 0,
      vy: 0,
      active: false,
    };
  }

  private onMove(e: PointerEvent) {
    const rect = this.root.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const d = this.drag;
    if (d && d.id === e.pointerId) {
      if (!d.active && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > DRAG_THRESHOLD) {
        d.active = true;
        this.suppressClick = true;
        this.root.classList.add('is-dragging');
        try {
          this.root.setPointerCapture(e.pointerId);
        } catch {
          /* pointer already released */
        }
        this.hideCursor();
      }
      if (d.active) {
        const dx = e.clientX - d.lx;
        const dy = e.clientY - d.ly;
        const dt = Math.max(1, e.timeStamp - d.lt);
        // Exponential moving average of velocity (px/ms) for the release fling.
        d.vx = d.vx * 0.6 + (dx / dt) * 0.4;
        d.vy = d.vy * 0.6 + (dy / dt) * 0.4;
        this.target.x += dx;
        this.target.y += dy;
      }
      d.lx = e.clientX;
      d.ly = e.clientY;
      d.lt = e.timeStamp;
    }

    if (this.finePointer && e.pointerType === 'mouse') {
      // Keep the bloom near centre — only a light nudge toward the pointer.
      this.focusTarget.x = this.vw / 2 + (px - this.vw / 2) * 0.14;
      this.focusTarget.y = this.vh / 2 + (py - this.vh / 2) * 0.14;
      if (!this.drag?.active) this.updateCursor(e, px, py);
    }
    this.kick();
  }

  private onUp(e: PointerEvent) {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    this.drag = null;
    this.root.classList.remove('is-dragging');
    if (d.active) {
      try {
        this.root.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      // Ignore stale velocity if the pointer rested before release.
      const idle = e.timeStamp - d.lt > 80;
      if (!this.reduced && !idle) {
        this.target.x += clamp(d.vx * 260, -1400, 1400);
        this.target.y += clamp(d.vy * 260, -1400, 1400);
      }
    }
    this.kick();
  }

  private onClick(e: MouseEvent) {
    if (this.suppressClick) {
      this.suppressClick = false;
      return;
    }
    const tileEl = (e.target as Element | null)?.closest<HTMLElement>('.wall-tile');
    const tile = tileEl ? this.tiles.find((t) => t.el === tileEl) : undefined;
    if (tile) this.open(tile);
  }

  private onKey(e: KeyboardEvent) {
    if (this.paused) return;
    const stepX = this.colStep;
    const stepY = this.rowStep;
    switch (e.key) {
      case 'ArrowLeft':
        this.target.x += stepX;
        break;
      case 'ArrowRight':
        this.target.x -= stepX;
        break;
      case 'ArrowUp':
        this.target.y += stepY;
        break;
      case 'ArrowDown':
        this.target.y -= stepY;
        break;
      case 'Enter':
      case ' ': {
        const t = this.centreTile();
        if (t) this.open(t);
        break;
      }
      default:
        return;
    }
    e.preventDefault();
    this.kick();
  }

  private open(t: Tile) {
    if (t.photo < 0) return;
    if (!t.requested) this.request(t);
    const rect = t.img.getBoundingClientRect();
    this.opts.onOpen?.(t.photo, rect, t.img.currentSrc || t.img.src || this.photos[t.photo].src);
  }

  /** Open whatever frame currently sits closest to the focal point. */
  openCentre() {
    const t = this.centreTile();
    if (t) this.open(t);
  }

  private centreTile() {
    let best: Tile | undefined;
    for (const t of this.tiles) if (!best || t.s > best.s) best = t;
    return best;
  }

  private markCentre(on: boolean) {
    for (const t of this.tiles) t.el.classList.remove('is-centre');
    if (on && this.root.matches(':focus-visible')) this.centreTile()?.el.classList.add('is-centre');
  }

  /* ------------------------------------------------------------------ */
  /* Hover label                                                         */
  /* ------------------------------------------------------------------ */

  private updateCursor(e: PointerEvent, px: number, py: number) {
    if (!this.cursor) return;
    const tileEl = (e.target as Element | null)?.closest<HTMLElement>('.wall-tile');
    const photo = tileEl ? this.photos[Number(tileEl.dataset.photo)] : undefined;
    if (!photo) return this.hideCursor();

    const label = photo.album?.title ?? photo.alt;
    const index = String(Number(tileEl?.dataset.photo) + 1).padStart(2, '0');
    if (this.cursor.dataset.key !== `${index}`) {
      this.cursor.dataset.key = index;
      this.cursor.innerHTML = '';
      const num = document.createElement('span');
      num.className = 'wall-cursor-num';
      num.textContent = index;
      const text = document.createElement('span');
      text.textContent = label;
      this.cursor.append(num, text);
    }
    this.cursorPos.tx = px;
    this.cursorPos.ty = py;
    if (!this.cursorPos.on) {
      this.cursorPos.x = px;
      this.cursorPos.y = py;
      this.cursorPos.on = true;
      this.cursor.classList.add('is-on');
    }
  }

  private hideCursor() {
    if (!this.cursor || !this.cursorPos.on) return;
    this.cursorPos.on = false;
    this.cursor.classList.remove('is-on');
  }

  /* ------------------------------------------------------------------ */
  /* Frame loop                                                          */
  /* ------------------------------------------------------------------ */

  private kick() {
    if (this.raf || this.paused) return;
    this.lastT = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  private readonly frame = (now: number) => {
    this.raf = 0;
    const dt = this.lastT ? Math.min(64, now - this.lastT) : 16.667;
    this.lastT = now;
    const ease = (base: number) => (this.reduced ? 1 : 1 - Math.pow(1 - base, dt / 16.667));

    const drifting = !!this.opts.drift && !this.reduced && this.inView && !this.drag && !document.hidden;
    if (drifting) {
      this.target.x -= 0.018 * dt;
      this.target.y -= 0.006 * dt;
    }

    const a = ease(this.drag?.active ? 0.38 : 0.085);
    this.cur.x += (this.target.x - this.cur.x) * a;
    this.cur.y += (this.target.y - this.cur.y) * a;

    const fa = ease(0.035);
    this.focus.x += (this.focusTarget.x - this.focus.x) * fa;
    this.focus.y += (this.focusTarget.y - this.focus.y) * fa;

    const introT = now - this.introStart;
    let introRunning = false;
    const margin = 260;

    for (const t of this.tiles) {
      // Where is this tile on the endless plane, and which virtual cell is it?
      const wx = t.gx + this.cur.x + this.worldW / 2;
      const wy = t.gy + this.cur.y + this.worldH / 2;
      const cycleX = Math.floor(wx / this.worldW);
      const cycleY = Math.floor(wy / this.worldH);
      const sx = this.vw / 2 + (wx - cycleX * this.worldW) - this.worldW / 2;
      const sy = this.vh / 2 + (wy - cycleY * this.worldH) - this.worldH / 2;

      const vc = t.col - cycleX * this.cols;
      const vr = t.row - cycleY * this.rows;
      if (vc !== t.vc || vr !== t.vr) this.assign(t, vc, vr);

      const dist = Math.hypot(sx - this.focus.x, sy - this.focus.y) / this.halfDiag;
      let s = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * smoothstep(clamp(1 - (dist - 0.12) / 0.88, 0, 1));

      if (!this.introDone) {
        const p = clamp((introT - t.delay) / INTRO_MS, 0, 1);
        if (p < 1) introRunning = true;
        const e = easeOutExpo(p);
        s *= 0.5 + 0.5 * e;
        t.el.style.opacity = e.toFixed(3);
      }

      if (!t.requested) {
        const hw = (t.w * s) / 2 + margin;
        const hh = (t.h * s) / 2 + margin;
        if (sx + hw > 0 && sx - hw < this.vw && sy + hh > 0 && sy - hh < this.vh) this.request(t);
      }

      if (sx !== t.sx || sy !== t.sy || s !== t.s) {
        const ss = s.toFixed(4);
        t.el.style.setProperty('--wall-s', ss);
        t.el.style.transform = `translate3d(${(sx - t.w / 2).toFixed(2)}px, ${(sy - t.h / 2).toFixed(2)}px, 0) scale(${ss})`;
        t.sx = sx;
        t.sy = sy;
        t.s = s;
      }
    }

    if (!this.introDone && !introRunning) {
      this.introDone = true;
      for (const t of this.tiles) t.el.style.removeProperty('opacity');
    }

    if (this.cursor && this.cursorPos.on) {
      const ca = ease(0.25);
      this.cursorPos.x += (this.cursorPos.tx - this.cursorPos.x) * ca;
      this.cursorPos.y += (this.cursorPos.ty - this.cursorPos.y) * ca;
      this.cursor.style.transform = `translate3d(${this.cursorPos.x + 16}px, ${this.cursorPos.y + 18}px, 0)`;
    }

    if (this.root.matches(':focus-visible')) this.markCentre(true);
    this.opts.onMove?.(this.cur.x, this.cur.y);

    const planeMoving =
      Math.abs(this.target.x - this.cur.x) > 0.05 ||
      Math.abs(this.target.y - this.cur.y) > 0.05 ||
      !!this.drag?.active ||
      drifting;
    const focusMoving =
      Math.abs(this.focusTarget.x - this.focus.x) > 0.1 ||
      Math.abs(this.focusTarget.y - this.focus.y) > 0.1;
    const cursorMoving =
      this.cursorPos.on &&
      (Math.abs(this.cursorPos.tx - this.cursorPos.x) > 0.1 ||
        Math.abs(this.cursorPos.ty - this.cursorPos.y) > 0.1);
    const moving = planeMoving || focusMoving || cursorMoving;

    // Loupe tracks plane + focus bloom; cursor jitter alone does not refresh it.
    if (planeMoving || focusMoving) {
      window.dispatchEvent(new CustomEvent('preview-loupe:invalidate'));
    }

    if (moving || drifting || !this.introDone || this.drag?.active) {
      this.raf = requestAnimationFrame(this.frame);
    } else {
      this.cur.x = this.target.x;
      this.cur.y = this.target.y;
    }
  };

  /* ------------------------------------------------------------------ */
  /* Lifecycle                                                           */
  /* ------------------------------------------------------------------ */

  pause() {
    this.paused = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  resume() {
    this.paused = false;
    this.relayout();
    this.kick();
  }

  destroy() {
    this.pause();
    this.ac.abort();
    this.ro.disconnect();
    this.io?.disconnect();
    window.clearTimeout(this.resizeTimer);
    wallRegistry.delete(this.root);
  }
}

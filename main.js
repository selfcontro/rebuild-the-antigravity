const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const header = document.querySelector("[data-header]");
const mobileToggle = document.querySelector("[data-mobile-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const dropdownButtons = Array.from(document.querySelectorAll("[data-dropdown-toggle]"));
const dropdownPanels = Array.from(document.querySelectorAll("[data-dropdown]"));
const revealItems = Array.from(document.querySelectorAll(".reveal"));
const sliderTrack = document.querySelector("[data-slider-track]");
const sliderCards = Array.from(document.querySelectorAll(".use-case-card"));
const prevButton = document.querySelector("[data-slider-prev]");
const nextButton = document.querySelector("[data-slider-next]");
const videoToggles = Array.from(document.querySelectorAll("[data-video-toggle]"));

let lastScrollY = window.scrollY;
let activeSlide = 0;

function closeDropdowns() {
  dropdownButtons.forEach((button) => button.setAttribute("aria-expanded", "false"));
  dropdownPanels.forEach((panel) => panel.classList.remove("is-open"));
}

function toggleDropdown(name) {
  const button = dropdownButtons.find((item) => item.dataset.dropdownToggle === name);
  const panel = dropdownPanels.find((item) => item.dataset.dropdown === name);
  if (!button || !panel) return;

  const opening = !panel.classList.contains("is-open");
  closeDropdowns();

  if (opening) {
    panel.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
  }
}

dropdownButtons.forEach((button) => {
  button.addEventListener("click", () => toggleDropdown(button.dataset.dropdownToggle));
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.closest(".nav-item")) closeDropdowns();
  if (!target.closest(".site-header") && mobileMenu) {
    mobileMenu.classList.remove("is-open");
    if (mobileToggle) mobileToggle.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDropdowns();
    mobileMenu?.classList.remove("is-open");
    mobileToggle?.setAttribute("aria-expanded", "false");
  }
});

mobileToggle?.addEventListener("click", () => {
  const opening = !mobileMenu?.classList.contains("is-open");
  mobileMenu?.classList.toggle("is-open", opening);
  mobileToggle.setAttribute("aria-expanded", String(opening));
});

function updateHeader() {
  if (!header) return;
  const currentScrollY = window.scrollY;
  header.classList.toggle("is-elevated", currentScrollY > 8);
  header.classList.toggle("is-hidden", currentScrollY > lastScrollY && currentScrollY > 220);
  lastScrollY = currentScrollY;
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.body.classList.add("motion-ready");
revealItems.forEach((item) => revealObserver.observe(item));
setTimeout(() => {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}, 1400);

function splitHeadingText() {
  const heading = document.querySelector("[data-split-text]");
  if (!heading || heading.dataset.splitReady === "true") return;

  const cursor = heading.querySelector(".blinking-cursor");
  const textNodes = Array.from(heading.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE);
  const textContent = textNodes.map((node) => node.textContent || "").join(" ").replace(/\s+/g, " ").trim();
  if (!textContent) return;

  heading.dataset.splitReady = "true";
  heading.innerHTML = "";

  textContent.split(" ").forEach((word, index, words) => {
    const span = document.createElement("span");
    span.className = "split-word";
    span.textContent = `${word}${index < words.length - 1 ? " " : ""}`;
    heading.appendChild(span);
  });

  if (cursor) heading.appendChild(cursor);

  requestAnimationFrame(() => {
    Array.from(heading.querySelectorAll(".split-word")).forEach((word, index) => {
      setTimeout(() => word.classList.add("is-visible"), 120 + index * 35);
    });
  });
}

function updateSlider() {
  if (!sliderTrack || !sliderCards.length) return;

  sliderCards.forEach((card, index) => card.classList.toggle("is-active", index === activeSlide));

  const offset = window.innerWidth <= 767 ? 100 : window.innerWidth <= 1280 ? 50 : 33.3333;
  sliderTrack.style.transform = `translateX(-${activeSlide * offset}%)`;
  sliderTrack.style.transition = "transform 0.45s cubic-bezier(0.215, 0.61, 0.355, 1)";

  prevButton?.classList.toggle("is-disabled", activeSlide === 0);
  nextButton?.classList.toggle("is-disabled", activeSlide === sliderCards.length - 1);
}

prevButton?.addEventListener("click", () => {
  if (activeSlide > 0) {
    activeSlide -= 1;
    updateSlider();
  }
});

nextButton?.addEventListener("click", () => {
  if (activeSlide < sliderCards.length - 1) {
    activeSlide += 1;
    updateSlider();
  }
});

videoToggles.forEach((button) => {
  button.addEventListener("click", () => {
    const surface = button.closest("[data-video-surface]");
    if (!surface) return;
    const playing = !surface.classList.contains("is-playing");
    surface.classList.toggle("is-playing", playing);
    button.textContent = playing ? "pause" : "play_arrow";
    button.setAttribute("aria-label", playing ? "Pause video" : "Play video");
  });
});

class ParticleField {
  constructor(canvas, mode) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.mode = mode;
    this.points = [];
    this.mouse = { x: -9999, y: -9999, px: -9999, py: -9999, vx: 0, vy: 0, active: false };
    this.trail = [];
    this.running = !reduceMotion;
    this.raf = 0;
    this.frame = 0;
    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
    this.handlePointer = this.handlePointer.bind(this);
    this.handleLeave = this.handleLeave.bind(this);
    this.init();
  }

  init() {
    if (!this.ctx) return;
    this.resize();
    window.addEventListener("resize", this.resize);
    this.canvas.addEventListener("pointermove", this.handlePointer);
    this.canvas.addEventListener("pointerleave", this.handleLeave);
    if (this.running) this.raf = requestAnimationFrame(this.render);
    else this.draw();
  }

  getConfig() {
    if (this.mode === "hero") {
      return {
        spacing: window.innerWidth < 768 ? 16 : 13,
        radius: window.innerWidth < 768 ? 0.9 : 1.05,
        influence: 150,
        pull: 0.14,
        settle: 0.16,
        jitter: 0.16,
      };
    }
    if (this.mode === "download") {
      return {
        spacing: window.innerWidth < 768 ? 18 : 15,
        radius: window.innerWidth < 768 ? 0.85 : 0.95,
        influence: 130,
        pull: 0.1,
        settle: 0.15,
        jitter: 0.12,
      };
    }
    return {
      spacing: window.innerWidth < 768 ? 18 : 15,
      radius: window.innerWidth < 768 ? 0.8 : 0.9,
      influence: 120,
      pull: 0.1,
      settle: 0.16,
      jitter: 0.1,
    };
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.buildPoints();
  }

  buildPoints() {
    const config = this.getConfig();
    const points = [];
    const spacing = config.spacing;

    for (let y = spacing * 0.5; y < this.height; y += spacing) {
      for (let x = spacing * 0.5; x < this.width; x += spacing) {
        const point = this.getPointAt(x, y, config);
        if (!point) continue;
        points.push({
          homeX: point.x,
          homeY: point.y,
          x: point.x,
          y: point.y,
          offsetX: 0,
          offsetY: 0,
          baseRadius: point.radius,
          radius: point.radius,
          alpha: point.alpha,
          tone: point.tone,
          phase: point.phase,
          weight: point.weight,
          scaleX: 1,
          scaleY: 1,
        });
      }
    }

    this.points = points;
  }

  getPointAt(x, y, config) {
    if (this.mode === "hero") {
      const cx = this.width * 0.59;
      const cy = this.height * 0.39;
      const rx = this.width * 0.22;
      const ry = this.height * 0.14;
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const distance = dx * dx + dy * dy;
      if (distance > 1.22) return null;
      const edge = Math.max(0, 1 - distance);
      return {
        x,
        y,
        radius: config.radius + edge * 0.45,
        alpha: 0.16 + edge * 0.42,
        tone: distance < 0.24 ? "blue" : distance < 0.7 ? "soft" : "base",
        phase: (x + y) * 0.018,
        weight: edge,
      };
    }

    if (this.mode === "download") {
      const cx = this.width * 0.54;
      const cy = this.height * 0.63;
      const rx = this.width * 0.34;
      const ry = this.height * 0.18;
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const distance = dx * dx + dy * dy;
      if (distance > 1.15) return null;
      const edge = Math.max(0, 1 - distance);
      return {
        x,
        y,
        radius: config.radius + edge * 0.25,
        alpha: 0.12 + edge * 0.28,
        tone: edge > 0.7 ? "green" : "base",
        phase: (x + y) * 0.012,
        weight: edge,
      };
    }

    const isLeft = this.mode === "morph-left";
    const cx = this.width * 0.5;
    const cy = this.height * 0.54;
    const rx = this.width * 0.3;
    const ry = this.height * 0.25;
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    const distance = dx * dx + dy * dy;
    if (distance > 1.12) return null;
    const edge = Math.max(0, 1 - distance);
    return {
      x,
      y,
      radius: config.radius + edge * 0.2,
      alpha: 0.12 + edge * 0.22,
      tone: isLeft ? (edge > 0.62 ? "blue" : "base") : edge > 0.62 ? "red" : "base",
      phase: (x + y) * 0.014,
      weight: edge,
    };
  }

  handlePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    const nextX = event.clientX - rect.left;
    const nextY = event.clientY - rect.top;
    if (Number.isFinite(this.mouse.x) && Number.isFinite(this.mouse.y)) {
      this.mouse.vx = nextX - this.mouse.x;
      this.mouse.vy = nextY - this.mouse.y;
    }
    this.mouse.px = this.mouse.x;
    this.mouse.py = this.mouse.y;
    this.mouse.x = nextX;
    this.mouse.y = nextY;
    this.mouse.active = true;
    this.trail.unshift({
      x: nextX,
      y: nextY,
      vx: this.mouse.vx,
      vy: this.mouse.vy,
      life: 1,
    });
    this.trail = this.trail.slice(0, 8);
  }

  handleLeave() {
    this.mouse.active = false;
    this.mouse.vx = 0;
    this.mouse.vy = 0;
    this.trail = [];
  }

  draw() {
    if (!this.ctx) return;
    const { influence, pull, settle, jitter } = this.getConfig();
    this.frame += 1;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.trail = this.trail
      .map((entry) => ({ ...entry, life: entry.life * 0.86 }))
      .filter((entry) => entry.life > 0.1);

    for (const point of this.points) {
      const waveX = Math.sin(this.frame * 0.015 + point.phase) * jitter * point.weight;
      const waveY = Math.cos(this.frame * 0.012 + point.phase * 1.3) * jitter * point.weight;
      let targetOffsetX = waveX;
      let targetOffsetY = waveY;
      let targetRadius = point.baseRadius;
      let targetScaleX = 1;
      let targetScaleY = 1;
      let glow = 0;

      if (this.mouse.active) {
        const mx = point.homeX - this.mouse.x;
        const my = point.homeY - this.mouse.y;
        const distanceSq = mx * mx + my * my;

        if (distanceSq < influence * influence) {
          const distance = Math.sqrt(distanceSq) || 1;
          const force = 1 - distance / influence;
          const directionX = mx / distance;
          const directionY = my / distance;
          const sideways = Math.sin((this.frame + point.phase * 30) * 0.02) * force * 4;
          const speed = Math.min(18, Math.hypot(this.mouse.vx, this.mouse.vy));
          const trailX = this.mouse.vx * force * 0.8;
          const trailY = this.mouse.vy * force * 0.45;
          const cursorColumn = Math.max(0, 1 - Math.abs(mx) / 12);
          const cursorHeight = Math.max(0, 1 - Math.abs(my) / 56);
          const cursorForce = cursorColumn * cursorHeight;
          targetOffsetX += directionX * force * influence * pull + sideways;
          targetOffsetY += directionY * force * influence * pull * 0.75;
          targetOffsetX -= trailX;
          targetOffsetY -= trailY;
          if (this.mode === "hero" && cursorForce > 0) {
            targetOffsetX += -mx * 0.78 * cursorForce;
            targetOffsetY += Math.sin(this.frame * 0.08 + point.phase * 18) * cursorForce * 2.2;
            targetScaleX = 0.42 + (1 - cursorForce) * 0.25;
            targetScaleY = 1.8 + cursorForce * 2.8 + speed * 0.03;
            targetRadius = point.baseRadius * (1.1 + cursorForce * 1.8);
          } else {
            targetScaleX = 0.84 + force * 0.2;
            targetScaleY = 1 + force * 0.8;
            targetRadius = point.baseRadius * (1 + force * 1.4);
          }
          glow = Math.max(force, cursorForce);
        }
      }

      for (const entry of this.trail) {
        const tx = point.homeX - entry.x;
        const ty = point.homeY - entry.y;
        const trailDistanceSq = tx * tx + ty * ty;
        const trailRadius = influence * 0.78 * entry.life;
        if (trailDistanceSq < trailRadius * trailRadius) {
          const trailDistance = Math.sqrt(trailDistanceSq) || 1;
          const trailForce = (1 - trailDistance / trailRadius) * entry.life;
          targetOffsetX -= entry.vx * trailForce * 0.48;
          targetOffsetY -= entry.vy * trailForce * 0.26;
          if (this.mode === "hero") {
            targetScaleY = Math.max(targetScaleY, 1 + trailForce * 2.1);
            targetScaleX = Math.min(targetScaleX, 0.92 - trailForce * 0.28);
            glow = Math.max(glow, trailForce * 0.85);
          }
        }
      }

      point.offsetX += (targetOffsetX - point.offsetX) * settle;
      point.offsetY += (targetOffsetY - point.offsetY) * settle;
      point.radius += (targetRadius - point.radius) * 0.2;
      point.scaleX += (targetScaleX - point.scaleX) * 0.18;
      point.scaleY += (targetScaleY - point.scaleY) * 0.18;
      point.x = point.homeX + point.offsetX;
      point.y = point.homeY + point.offsetY;

      this.ctx.globalAlpha = Math.min(1, point.alpha + glow * 0.18);
      this.ctx.fillStyle =
        point.tone === "blue"
          ? "rgba(50, 121, 249, 0.9)"
          : point.tone === "green"
            ? "rgba(110, 195, 164, 0.8)"
            : point.tone === "red"
              ? "rgba(255, 142, 142, 0.8)"
              : point.tone === "soft"
                ? "rgba(138, 177, 255, 0.62)"
                : "rgba(69, 71, 77, 0.34)";

      const width = Math.max(0.8, point.radius * 2 * point.scaleX);
      const height = Math.max(0.8, point.radius * 2 * point.scaleY);
      this.ctx.fillRect(point.x - width * 0.5, point.y - height * 0.5, width, height);
    }

    this.ctx.globalAlpha = 1;
  }

  render() {
    this.draw();
    this.raf = requestAnimationFrame(this.render);
  }
}

function initParticles() {
  document.querySelectorAll("canvas[data-particles]").forEach((canvas) => {
    new ParticleField(canvas, canvas.dataset.particles);
  });
}

splitHeadingText();
updateHeader();
updateSlider();
initParticles();

window.addEventListener("scroll", updateHeader, { passive: true });
window.addEventListener("resize", updateSlider);

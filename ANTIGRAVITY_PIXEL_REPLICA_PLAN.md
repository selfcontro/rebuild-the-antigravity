# Antigravity Pixel Replica Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the current static scaffold into a high-fidelity local replica of `https://antigravity.google/`, prioritizing the first viewport, particle canvas, typography, motion, video sections, and responsive layout.

**Architecture:** Keep the project as a dependency-free static site unless exact WebGL parity requires adding a renderer later. Split the work into focused CSS tokens, semantic page sections, a canvas particle engine, scroll/text animation controllers, and browser verification artifacts.

**Tech Stack:** HTML, CSS custom properties, vanilla JavaScript, Canvas/WebGL-style particle rendering, `next-browser` for visual verification.

---

## Source Page Findings

The target page is an Angular single-page app using Google Sans Flex, GSAP/SplitText-style text animation, Three.js/WebGL canvas particles, MP4 videos, and Google product design tokens. The visible page is not a simple DOM particle effect.

Observed implementation details:

- Framework: Angular SPA with routes for product, use cases, pricing, blog, docs, download, releases, and press.
- Animation runtime: GSAP is present. Console warnings mention SplitText before fonts load.
- 3D/particles: `__THREE__` exists at runtime. Particle layers are canvas-based, not DOM dots.
- Main particle containers:
  - `.main-particles-component-section`
  - `.main-particles-container`
  - `.morphing-particles-component-section`
  - `.morphing-particles-container`
- Key videos:
  - `/assets/video/hero_video.mp4`
  - `/assets/video/landing/an-agent-first-experience.mp4`
  - `/assets/video/landing/an-ai-ide-core.mp4`
  - `/assets/video/landing/higher-level-abstractions.mp4`
  - `/assets/video/landing/cross-surface-agents.mp4`
  - `/assets/video/landing/user-feedback.mp4`
- Key image:
  - `/assets/image/antigravity-cursor.png`
- First viewport at `1440x1000`:
  - Header height: `52px`
  - Header background: `rgba(255, 255, 255, 0.85)` with blur
  - H1 font size: `80px`
  - H1 line-height: `88px`
  - H1 font weight: `450`
  - H1 text: `Experience liftoff with the next-gen agent platform`
  - First full-screen particle canvas: `1440x1000`
  - Hero video is below the first fold, rounded with `36px`

## Fidelity Target

The first implementation target is not full site parity. It is pixel-level parity for the first viewport and strong visual parity for the rest of the landing page.

Priority order:

1. Header layout, typography, spacing, nav behavior, and button styling.
2. First viewport hero text, blinking cursor, background particle canvas, CTA placement.
3. Hero video section with correct aspect ratio, rounding, custom play overlay, and spacing.
4. Agent-first typed text section with icon list and cursor.
5. Feature explorer section with square videos and synchronized text.
6. Use case carousel cards.
7. Try/download sections with morphing particles.
8. Footer layout.

## File Structure

Create or modify these files:

- Modify: `index.html`
  - Replace the current inspired layout with target-like semantic sections.
  - Preserve accessibility labels for nav, buttons, videos, and sections.
- Modify: `styles.css`
  - Replace current dark replica theme with Google Antigravity design tokens.
  - Add responsive grid, typography, section spacing, buttons, videos, header, footer.
- Modify: `main.js`
  - Replace the small reveal script with modules for header state, dropdowns, text animation, scroll reveal, video controls, and particle rendering.
- Create: `assets/README.md`
  - Document required media assets and safe replacement strategy.
- Optional create: `assets/`
  - Store local replacement cursor image, poster frames, and videos only if legally available or generated.

Recommended JS decomposition if the file grows:

- `scripts/particles.js`
  - Owns particle classes, canvas setup, resize, render loop, target morphing.
- `scripts/interactions.js`
  - Owns header, dropdowns, buttons, video controls, scroll observers.
- `scripts/text-effects.js`
  - Owns split text, typed reveal, blinking cursor timing.

For the current small static repo, it is acceptable to keep everything in `main.js` for the first pass, then split once behavior is stable.

## Visual System

Use these target tokens as the base:

```css
:root {
  --palette-grey-0: #ffffff;
  --palette-grey-10: #f8f9fc;
  --palette-grey-20: #eff2f7;
  --palette-grey-50: #e6eaf0;
  --palette-grey-100: #e1e6ec;
  --palette-grey-200: #cdd4dc;
  --palette-grey-300: #b2bbc5;
  --palette-grey-400: #b7bfd9;
  --palette-grey-800: #45474d;
  --palette-grey-900: #2f3034;
  --palette-grey-1000: #212226;
  --palette-grey-1100: #18191d;
  --palette-grey-1200: #121317;
  --palette-blue-600: #3279f9;

  --text-main: var(--palette-grey-1200);
  --text-muted: var(--palette-grey-800);
  --surface: var(--palette-grey-0);
  --surface-soft: var(--palette-grey-10);
  --outline: rgba(33, 34, 38, 0.12);
  --outline-soft: rgba(33, 34, 38, 0.06);

  --page-margin: 72px;
  --nav-height: 52px;
  --radius-pill: 9999px;
  --radius-xl: 36px;
}
```

Typography:

- Use Google Sans Flex if allowed through the Google Fonts URL.
- Fallback: `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Desktop hero:
  - `font-size: 80px`
  - `line-height: 88px`
  - `font-weight: 450`
  - `letter-spacing: -1.44px` or close.
- Body copy:
  - `17.5px`
  - `line-height: 25.38px`
  - `font-weight: 400`

Buttons:

- Primary: black/dark grey pill, white text.
- Secondary: transparent grey pill, black text.
- Hover: background shift only; avoid large translate motion.

## Page Sections

### 1. Header

Target structure:

- Fixed top header.
- Height `52px`.
- Left: logo lockup.
- Center/left nav: Product, Use Cases, Pricing, Blog, Resources.
- Right: Download pill button.
- Mobile: menu button and accordion nav.

Implementation details:

- Use `position: fixed; top: 0; z-index: 20`.
- Use background `rgba(255,255,255,0.85)` and `backdrop-filter: blur(8px)`.
- Add `transform 0.3s ease-in-out` for hide/show or scroll state.
- Dropdown links fade with `opacity 0.2s ease`.

### 2. Hero

Target structure:

- Full viewport wrapper.
- Background canvas particles fill viewport.
- Centered product logo/cursor mark above H1.
- H1: `Experience liftoff with the next-gen agent platform`.
- CTA row: Download for MacOS, Explore use cases.
- Blinking cursor image after text.

Implementation details:

- Canvas must sit behind text and above the base background.
- Text block vertical center should match the target: around `y=287` to `y=713` at `1440x1000`.
- CTA buttons sit around `y=605`.
- Cursor blink duration: `0.5s infinite`.

### 3. Hero Video

Target structure:

- Large rounded video below first fold.
- Aspect ratio roughly `16:9`.
- Border radius `36px`.
- Custom play overlay in bottom right.

Implementation details:

- Use local placeholder video/poster until safe source media is available.
- `autoplay`, `loop`, `playsinline`.
- Prefer muted video for reliable autoplay in local browsers.

### 4. Agent-First Section

Target structure:

- Icon list with many subtle list items.
- Large typed heading with Antigravity cursor.
- Supporting text and video.

Implementation details:

- Use scroll-triggered text reveal.
- Cursor should be a narrow image or CSS block matching target proportions.

### 5. Feature Explorer

Target structure:

- Stacked feature copy and square video panels.
- Feature videos are `624x624` at desktop.
- Copy changes alongside visible media.

Implementation details:

- Start with static stacked sections.
- Add scroll-progress highlighting after visual layout is correct.

### 6. Use Cases

Target structure:

- Heading: `Built for developers for the agent-first era`.
- Horizontal cards for Frontend developer, Full stack developer, Enterprise developer.
- Card images are large, rounded, and carousel-controlled.

Implementation details:

- Use CSS scroll-snap first.
- Add left/right controls after layout matches.

### 7. Try / Download Sections

Target structure:

- Two-column solution panels.
- Morphing particle backgrounds left/right.
- Download CTA section with large particle background and platform-specific buttons.

Implementation details:

- Reuse the particle engine with different target shapes and bounds.
- Use lower particle count on mobile.

## Particle Engine Plan

The target uses WebGL/Three-like canvas particles. A credible local replica needs canvas particles with morph targets, mouse interaction, and scroll-aware activation.

### Data Model

```js
const particle = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  tx: 0,
  ty: 0,
  radius: 1.8,
  baseRadius: 1.8,
  alpha: 0.7,
  hueShift: 0
};
```

### Physics Model

Use damped spring motion:

```js
const dx = particle.tx - particle.x;
const dy = particle.ty - particle.y;

particle.vx += dx * spring;
particle.vy += dy * spring;

particle.vx += noiseX * noiseStrength;
particle.vy += noiseY * noiseStrength;

particle.vx *= damping;
particle.vy *= damping;

particle.x += particle.vx;
particle.y += particle.vy;
```

Recommended starting constants:

- `spring: 0.018`
- `damping: 0.91`
- `noiseStrength: 0.08`
- `mouseRadius: 140`
- `mouseForce: 1.1`
- `maxDpr: 2`
- Desktop particle count: `1200-2200`
- Mobile particle count: `450-800`

### Mouse Interaction

Behavior:

- Mouse movement should repel nearby particles.
- Particles should return to target positions smoothly.
- Response should feel immediate but not elastic-heavy.

Formula:

```js
const mx = particle.x - mouse.x;
const my = particle.y - mouse.y;
const distSq = mx * mx + my * my;

if (distSq < mouseRadius * mouseRadius) {
  const dist = Math.sqrt(distSq) || 1;
  const force = (1 - dist / mouseRadius) * mouseForce;
  particle.vx += (mx / dist) * force;
  particle.vy += (my / dist) * force;
  particle.radius = particle.baseRadius * (1 + force * 0.4);
}
```

### Shape Morphing

Target shapes:

- Hero: loose orbital cloud around the text center.
- Try section: icon-like fields on left and right.
- Download section: wide oval/nebula shape behind CTA text.

Generate targets with deterministic seeded randomness:

- Use polar coordinates for orbital fields.
- Use image alpha sampling for logo/cursor shapes if safe assets exist.
- Use text raster sampling for typed words only if performance remains acceptable.

### Particle Rendering

Canvas 2D first pass:

```js
ctx.globalAlpha = particle.alpha;
ctx.fillStyle = particle.color;
ctx.beginPath();
ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
ctx.fill();
```

High-fidelity pass:

- Switch to WebGL points or Three.js `Points`.
- Use additive blending only lightly.
- Use round point sprites with soft alpha edges.
- Keep color mostly grey/blue, not rainbow.

## Motion Plan

### Text

- Split hero text into words/spans after fonts are loaded.
- Animate words from `opacity: 0`, `y: 18px` to visible.
- Duration: `0.65s`.
- Stagger: `0.035s`.
- Easing: `cubic-bezier(.215, .61, .355, 1)`.

### Cursor

- Use CSS blink:

```css
@keyframes blink {
  0%, 45% { opacity: 1; }
  46%, 100% { opacity: 0; }
}
```

- Duration: `0.5s`.
- Infinite.

### Scroll

- Use `IntersectionObserver` for reveal.
- Use `requestAnimationFrame` for particle render.
- Avoid scroll handlers that mutate layout directly.
- Add section activation to pause offscreen particle canvases.

### Dropdowns

- Open on click and keyboard activation.
- Close on outside click, Escape, or route/hash change.
- Animate opacity and y offset only.

## Asset Strategy

Do not copy proprietary Google assets into the repo unless explicitly permitted.

Safe options:

1. Use generated placeholder videos/images with similar composition.
2. Use CSS/Cavas-generated particle fields and interface mockups.
3. Keep source asset URLs documented in `assets/README.md` for reference only.
4. If this is local-only research, download assets only after explicit user approval.

Required local replacements:

- Antigravity cursor image or CSS-built cursor.
- Hero video or poster.
- Five feature videos or animated placeholders.
- Use case card thumbnails.
- Blog card images if the lower page is implemented.

## Implementation Tasks

### Task 1: Establish Target Tokens and Layout Grid

**Files:**
- Modify: `styles.css`
- Modify: `index.html`

- [ ] Replace current theme variables with target grey/blue tokens.
- [ ] Add `Google Sans Flex` font loading or fallback-only stack.
- [ ] Implement `grid-container`, `grid-row`, and responsive margins.
- [ ] Rebuild header spacing and fixed positioning.
- [ ] Verify at `1440x1000`, `1024x768`, and `390x844`.

Expected result:

- Header height is `52px`.
- Body background reads white/light grey, not dark.
- Text color is close to `#121317`.

### Task 2: Rebuild First Viewport Hero

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

- [ ] Replace current hero headline with target text.
- [ ] Add logo/cursor mark area.
- [ ] Add CTA row with `Download for MacOS` and `Explore use cases`.
- [ ] Position the hero text to match the target viewport.
- [ ] Add CSS blinking cursor.

Expected result:

- H1 is visually centered and uses 80px desktop sizing.
- CTA row sits below the heading with pill buttons.

### Task 3: Add Particle Canvas Engine

**Files:**
- Modify: `index.html`
- Modify: `main.js`
- Modify: `styles.css`

- [ ] Add `<canvas data-particles="hero">` inside the hero background.
- [ ] Implement resize-aware canvas setup.
- [ ] Implement particle initialization.
- [ ] Implement damped spring motion.
- [ ] Implement mouse repulsion.
- [ ] Implement pause/resume when offscreen.
- [ ] Tune color, radius, opacity, count, damping, and mouse force.

Expected result:

- The first viewport has a soft canvas particle field.
- Mouse movement creates subtle immediate displacement.
- Particles return to stable target positions without jitter.

### Task 4: Hero Video Section

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `main.js`

- [ ] Add video wrapper below hero.
- [ ] Add `video` element with local placeholder source or poster.
- [ ] Add custom play/pause button.
- [ ] Implement video control click handler.
- [ ] Match `36px` video border radius.

Expected result:

- Large video appears below first viewport.
- Control button animates with opacity/transform transitions.

### Task 5: Agent-First and Feature Sections

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `main.js`

- [ ] Add agent-first typed text section.
- [ ] Add icon list / bouncer list visual.
- [ ] Add five feature copy blocks.
- [ ] Add square media panels at `624x624` desktop.
- [ ] Add scroll reveal and active media highlighting.

Expected result:

- The middle page reads like the target: text-driven, large media, calm spacing.

### Task 6: Use Case Carousel

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `main.js`

- [ ] Add use case heading.
- [ ] Add three carousel cards.
- [ ] Add left/right controls.
- [ ] Implement scroll-snap or transform-based carousel.
- [ ] Add disabled button states.

Expected result:

- Cards are large, image-led, and horizontally navigable.

### Task 7: Morphing Particle Sections

**Files:**
- Modify: `index.html`
- Modify: `main.js`
- Modify: `styles.css`

- [ ] Add two smaller particle canvases for solution panels.
- [ ] Add one wide particle canvas for download CTA.
- [ ] Reuse particle engine with different target generators.
- [ ] Lower particle count on mobile.

Expected result:

- Lower particle sections feel related to the hero, but less visually dominant.

### Task 8: Footer and Final Responsive Pass

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

- [ ] Add footer links and Google-style lower footer.
- [ ] Fix mobile nav.
- [ ] Verify no text overlap at narrow widths.
- [ ] Verify all buttons fit their containers.

Expected result:

- Page is usable and visually stable across desktop and mobile.

## Verification Plan

Run these checks after implementation:

```bash
node --check main.js
python3 -m http.server 4173
next-browser open http://127.0.0.1:4173/index.html
next-browser viewport 1440x1000
next-browser screenshot local-antigravity-1440 --full-page
next-browser viewport 390x844
next-browser screenshot local-antigravity-mobile --full-page
next-browser browser-logs
```

Manual visual checklist:

- [ ] Header is fixed, 52px high, and blur-backed.
- [ ] H1 size, line-height, and position match the target first viewport.
- [ ] Cursor blinks at about 0.5s.
- [ ] Particle canvas covers the first viewport.
- [ ] Mouse movement repels particles subtly.
- [ ] Particle motion has damping and no visible jitter.
- [ ] Hero CTA buttons match pill shape and hover behavior.
- [ ] Hero video is large, rounded, and correctly spaced.
- [ ] Mobile layout has no overlap.
- [ ] Browser console has no runtime errors.

## Risks and Decisions

- Exact pixel parity requires source-quality media. Without equivalent MP4 assets, the lower page can only be structurally similar.
- Google logos, text, images, and videos may be protected. Keep the local build as a study replica or replace brand assets with generated equivalents.
- The particle engine is the hardest part. If Canvas 2D cannot match the feel, move to Three.js/WebGL in a later pass.
- Do not tune the whole page before the first viewport is close. The hero determines whether the replica feels correct.

## Recommended Next Execution Order

1. Implement Task 1 and Task 2 together to lock the static first viewport.
2. Implement Task 3 and tune particles until the first screenshot is close.
3. Add hero video and controls.
4. Build remaining sections with static media placeholders.
5. Add scroll and carousel interactions.
6. Run desktop/mobile screenshot verification.
7. Compare against the captured target screenshot and tune spacing/color/motion.

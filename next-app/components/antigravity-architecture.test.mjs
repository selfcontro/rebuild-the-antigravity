import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const source = readFileSync(new URL("./antigravity.tsx", import.meta.url), "utf8");

test("Antigravity uses shader-driven plane instances instead of CPU capsule particles", () => {
  assert.match(source, /PlaneGeometry/);
  assert.match(source, /ShaderMaterial/);
  assert.match(source, /aOffset/);
  assert.match(source, /aRandom/);
  assert.doesNotMatch(source, /capsuleGeometry/);
  assert.doesNotMatch(source, /setMatrixAt/);
});

test("Antigravity keeps default render pressure bounded and disposes GPU resources", () => {
  assert.match(source, /particleColumns = 100/);
  assert.match(source, /particleRows = 55/);
  assert.match(source, /dpr=\{1\}/);
  assert.match(source, /geometry\.dispose\(\)/);
  assert.match(source, /material\.dispose\(\)/);
});

test("Antigravity ports the Medusae halo and particle deformation controls", () => {
  assert.match(source, /const MEDUSAE_MOTION_DEFAULTS = \{/);
  assert.match(source, /uOuterOscFrequency/);
  assert.match(source, /uOuterOscAmplitude/);
  assert.match(source, /uHaloRadiusBase/);
  assert.match(source, /uHaloRadiusAmplitude/);
  assert.match(source, /uHaloShapeAmplitude/);
  assert.match(source, /uHaloRimWidth/);
  assert.match(source, /uHaloOuterStartOffset/);
  assert.match(source, /uHaloOuterEndOffset/);
  assert.match(source, /uHaloScaleX/);
  assert.match(source, /uHaloScaleY/);
  assert.match(source, /uParticleBaseSize/);
  assert.match(source, /uParticleActiveSize/);
  assert.match(source, /uBlobScaleX/);
  assert.match(source, /uBlobScaleY/);
  assert.match(source, /uParticleRotationSpeed/);
  assert.match(source, /uParticleRotationJitter/);
  assert.match(source, /uParticleOscillationFactor/);
  assert.match(source, /cursorFollowStrength/);
  assert.doesNotMatch(source, /float radius = 3\.0/);
  assert.doesNotMatch(source, /float baseSize = 0\.058/);
});

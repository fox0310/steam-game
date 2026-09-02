import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  DEFAULT_SETTINGS,
  SOUND_OPTIONS,
  createTriggerState,
  parseStoredSettings,
  serializeSettings,
} from "./trigger-state.js";

function testStableFaceTriggersOnce() {
  const trigger = createTriggerState({ armMs: 500, exitMs: 2_000 });
  trigger.start();

  assert.equal(trigger.observeFace(true, 0).triggered, false);
  assert.equal(trigger.state, "arming");
  assert.equal(trigger.observeFace(true, 499).triggered, false);
  assert.equal(trigger.observeFace(true, 500).triggered, true);
  assert.equal(trigger.state, "playing");
  assert.equal(trigger.observeFace(true, 5_000).triggered, false);

  trigger.finishPlaying(5_000);
  assert.equal(trigger.state, "wait-for-exit");
  assert.equal(trigger.observeFace(true, 9_000).triggered, false);
}

function testBriefFaceDoesNotTrigger() {
  const trigger = createTriggerState();
  trigger.start();
  trigger.observeFace(true, 100);
  trigger.observeFace(false, 450);

  assert.equal(trigger.state, "ready");
  assert.equal(trigger.observeFace(true, 500).triggered, false);
  assert.equal(trigger.observeFace(true, 999).triggered, false);
  assert.equal(trigger.observeFace(true, 1_000).triggered, true);
}

function testExitMustLastTwoSeconds() {
  const trigger = createTriggerState();
  trigger.start();
  trigger.observeFace(true, 0);
  trigger.observeFace(true, 500);
  trigger.finishPlaying(1_000);
  trigger.observeFace(false, 1_100);

  assert.equal(trigger.observeFace(false, 3_099).ready, false);
  assert.equal(trigger.state, "wait-for-exit");
  assert.equal(trigger.observeFace(false, 3_100).ready, true);
  assert.equal(trigger.state, "ready");
}

function testExitDuringPlaybackCanResetAtFinish() {
  const trigger = createTriggerState();
  trigger.start();
  trigger.observeFace(true, 0);
  trigger.observeFace(true, 500);
  trigger.observeFace(false, 1_000);
  trigger.observeFace(false, 3_000);
  trigger.finishPlaying(3_000);

  assert.equal(trigger.state, "ready");
}

function testPauseRequiresFreshExitCycle() {
  const trigger = createTriggerState();
  trigger.start();
  trigger.observeFace(true, 0);
  trigger.pause();
  assert.equal(trigger.state, "paused");

  trigger.resume(1_000);
  assert.equal(trigger.state, "wait-for-exit");
  trigger.observeFace(false, 1_000);
  assert.equal(trigger.observeFace(false, 2_999).ready, false);
  assert.equal(trigger.observeFace(false, 3_000).ready, true);
}

function testManualTriggerReturnsToReady() {
  const trigger = createTriggerState();
  trigger.start();
  assert.equal(trigger.forceTrigger(0).triggered, true);
  assert.equal(trigger.state, "playing");
  trigger.finishPlaying(7_000);
  assert.equal(trigger.state, "ready");
}

function testSettingsValidation() {
  assert.deepEqual(parseStoredSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(parseStoredSettings("not-json"), DEFAULT_SETTINGS);
  assert.deepEqual(
    parseStoredSettings(JSON.stringify({ schemaVersion: 99, settings: {} })),
    DEFAULT_SETTINGS,
  );

  const stored = serializeSettings({
    ...DEFAULT_SETTINGS,
    sound: "music",
    volume: 0.6,
    duration: 12,
    triggerCount: 4,
  });
  const parsed = parseStoredSettings(stored);
  assert.equal(parsed.sound, "music");
  assert.equal(parsed.volume, 0.6);
  assert.equal(parsed.duration, 12);
  assert.equal(parsed.triggerCount, 4);

  const invalid = parseStoredSettings(
    JSON.stringify({
      schemaVersion: 1,
      settings: {
        sound: "mandarin",
        volume: 9,
        duration: -1,
        facingMode: "sideways",
        visualMode: "laser",
        triggerCount: -2,
      },
    }),
  );
  assert.deepEqual(invalid, DEFAULT_SETTINGS);
}

function testSoundOptionsAreCantoneseOnly() {
  assert.deepEqual(
    SOUND_OPTIONS.map(({ id }) => id),
    ["morning", "afternoon", "hello", "class-g", "music"],
  );
  assert.equal(
    SOUND_OPTIONS.filter(({ kind }) => kind === "speech").every(
      ({ lang }) => lang === "zh-HK",
    ),
    true,
  );
}

function testApprovedUiStructure() {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  assert.equal((html.match(/data-sound=/g) || []).length, 5);
  assert.equal(html.includes("data-sound=\"music\""), true);
  assert.equal(html.includes("裝置編號"), false);
  assert.equal(html.includes("普通話"), false);
  assert.equal(html.includes("id=\"btn-start\""), true);
  assert.equal(html.includes("id=\"btn-share\""), true);
}

function testLocalFaceRuntimeWiring() {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.equal(html.includes("./vendor/face_mesh/face_mesh.js"), true);
  assert.equal(html.includes("camera_utils"), false);
  assert.equal(app.includes("new window.FaceMesh"), true);
  assert.equal(app.includes("navigator.mediaDevices.getUserMedia"), true);
  assert.equal(app.includes("./vendor/face_mesh/"), true);
}

function testOfflinePwaOwners() {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.equal(existsSync(new URL("./manifest.webmanifest", import.meta.url)), true);
  assert.equal(existsSync(new URL("./service-worker.js", import.meta.url)), true);
  assert.equal(existsSync(new URL("./vendor/qrcode.min.js", import.meta.url)), true);
  assert.equal(app.includes("serviceWorker.register"), true);
  assert.equal(app.includes("https://fox0310.github.io/steam-game/"), true);
}

testStableFaceTriggersOnce();
testBriefFaceDoesNotTrigger();
testExitMustLastTwoSeconds();
testExitDuringPlaybackCanResetAtFinish();
testPauseRequiresFreshExitCycle();
testManualTriggerReturnsToReady();
testSettingsValidation();
testSoundOptionsAreCantoneseOnly();
testApprovedUiStructure();
testLocalFaceRuntimeWiring();
testOfflinePwaOwners();

console.log("face-trigger self-check: 11 checks passed");

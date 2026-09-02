export const SOUND_OPTIONS = Object.freeze([
  { id: "morning", label: "早晨", kind: "speech", text: "早晨", lang: "zh-HK", audio: "./assets/audio/morning.wav" },
  { id: "afternoon", label: "午安", kind: "speech", text: "午安", lang: "zh-HK", audio: "./assets/audio/afternoon.wav" },
  { id: "hello", label: "你好", kind: "speech", text: "你好", lang: "zh-HK", audio: "./assets/audio/hello.wav" },
  { id: "class-g", label: "G班", kind: "speech", text: "G班", lang: "zh-HK", audio: "./assets/audio/class-g.wav" },
  { id: "music", label: "輕快音樂", kind: "music" },
]);

export const DEFAULT_SETTINGS = Object.freeze({
  sound: "morning",
  volume: 1,
  duration: 7,
  facingMode: "user",
  visualMode: "dot",
  triggerCount: 0,
});

const SCHEMA_VERSION = 1;
const SOUND_IDS = new Set(SOUND_OPTIONS.map(({ id }) => id));
const FACING_MODES = new Set(["user", "environment"]);
const VISUAL_MODES = new Set(["dot", "hud", "box", "none"]);

function defaults() {
  return { ...DEFAULT_SETTINGS };
}

function isValidSettings(value) {
  return (
    value &&
    SOUND_IDS.has(value.sound) &&
    Number.isFinite(value.volume) &&
    value.volume >= 0 &&
    value.volume <= 1 &&
    Number.isInteger(value.duration) &&
    value.duration >= 3 &&
    value.duration <= 30 &&
    FACING_MODES.has(value.facingMode) &&
    VISUAL_MODES.has(value.visualMode) &&
    Number.isInteger(value.triggerCount) &&
    value.triggerCount >= 0
  );
}

export function parseStoredSettings(raw) {
  if (!raw) return defaults();

  try {
    const parsed = JSON.parse(raw);
    if (parsed.schemaVersion !== SCHEMA_VERSION || !isValidSettings(parsed.settings)) {
      return defaults();
    }
    return { ...parsed.settings };
  } catch {
    return defaults();
  }
}

export function serializeSettings(settings) {
  const safeSettings = isValidSettings(settings) ? settings : DEFAULT_SETTINGS;
  return JSON.stringify({ schemaVersion: SCHEMA_VERSION, settings: safeSettings });
}

export function createTriggerState({ armMs = 500, exitMs = 2_000 } = {}) {
  let state = "idle";
  let facePresent = false;
  let armStartedAt = null;
  let absentStartedAt = null;

  function result(triggered = false, ready = false) {
    return { triggered, ready, state };
  }

  return {
    get state() {
      return state;
    },

    start() {
      state = "ready";
      facePresent = false;
      armStartedAt = null;
      absentStartedAt = null;
      return result(false, true);
    },

    observeFace(present, now) {
      facePresent = Boolean(present);

      if (["idle", "paused", "error"].includes(state)) return result();

      if (state === "playing") {
        if (facePresent) absentStartedAt = null;
        else if (absentStartedAt === null) absentStartedAt = now;
        return result();
      }

      if (state === "wait-for-exit") {
        if (facePresent) {
          absentStartedAt = null;
        } else if (absentStartedAt === null) {
          absentStartedAt = now;
        } else if (now - absentStartedAt >= exitMs) {
          state = "ready";
          armStartedAt = null;
          return result(false, true);
        }
        return result();
      }

      if (!facePresent) {
        state = "ready";
        armStartedAt = null;
        return result(false, true);
      }

      if (state === "ready") {
        state = "arming";
        armStartedAt = now;
        return result();
      }

      if (state === "arming" && now - armStartedAt >= armMs) {
        state = "playing";
        absentStartedAt = null;
        return result(true, false);
      }

      return result();
    },

    finishPlaying(now) {
      if (state !== "playing") return result();
      if (!facePresent && absentStartedAt !== null && now - absentStartedAt >= exitMs) {
        state = "ready";
        armStartedAt = null;
        return result(false, true);
      }
      state = "wait-for-exit";
      return result();
    },

    forceTrigger(now) {
      if (["idle", "playing", "paused", "error"].includes(state)) return result();
      state = "playing";
      facePresent = false;
      armStartedAt = null;
      absentStartedAt = now;
      return result(true, false);
    },

    pause() {
      state = "paused";
      armStartedAt = null;
      absentStartedAt = null;
      return result();
    },

    resume() {
      state = "wait-for-exit";
      facePresent = true;
      armStartedAt = null;
      absentStartedAt = null;
      return result();
    },

    fail() {
      state = "error";
      return result();
    },
  };
}

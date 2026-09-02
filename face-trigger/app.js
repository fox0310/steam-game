import {
  DEFAULT_SETTINGS,
  SOUND_OPTIONS,
  createTriggerState,
  parseStoredSettings,
  serializeSettings,
} from "./trigger-state.js";

const STORAGE_KEY = "face-trigger-settings";
const CANONICAL_URL = "https://fox0310.github.io/steam-game/";
const trigger = createTriggerState();
let settings = parseStoredSettings(localStorage.getItem(STORAGE_KEY));
let started = false;
let detecting = true;
let audioContext;
let activeAudioNodes = [];
let playbackTimer;
let countdownTimer;
let toastTimer;
let faceMesh;
let cameraStream;
let cameraStarted = false;
let wakeLock;
let frameRequest;
let processingFrame = false;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const elements = {
  start: $("#btn-start"),
  startOverlay: $("#start-overlay"),
  startError: $("#start-error"),
  statusBadge: $("#status-badge"),
  statusText: $("#status-text"),
  countdown: $("#countdown"),
  countdownText: $("#countdown-text"),
  audioWave: $("#audio-wave"),
  toggle: $("#btn-toggle"),
  stop: $("#btn-stop"),
  manual: $("#btn-manual"),
  volume: $("#volume"),
  volumeOutput: $("#volume-output"),
  count: $("#trigger-count"),
  durationStat: $("#duration-stat"),
  selectedLabel: $("#selected-label"),
  duration: $("#duration"),
  durationOutput: $("#duration-output"),
  visualMode: $("#visual-mode"),
  camera: $("#camera"),
  canvas: $("#face-overlay"),
  settingsDialog: $("#settings-dialog"),
  shareDialog: $("#share-dialog"),
  qrCode: $("#qr-code"),
  shareUrl: $("#share-url"),
  toast: $("#toast"),
  offlineStatus: $("#offline-status"),
};

function persistSettings() {
  localStorage.setItem(STORAGE_KEY, serializeSettings(settings));
}

function setStatus(state, text) {
  elements.statusBadge.dataset.state = state;
  elements.statusText.textContent = text;
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = setTimeout(() => {
    elements.toast.hidden = true;
  }, 2_800);
}

function updateSoundButtons() {
  const sound = SOUND_OPTIONS.find(({ id }) => id === settings.sound) || SOUND_OPTIONS[0];
  elements.selectedLabel.textContent = sound.label;
  $$("[data-sound]").forEach((button) => {
    const selected = button.dataset.sound === sound.id;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function syncSettingsUi() {
  elements.volume.value = settings.volume;
  elements.volumeOutput.value = `${Math.round(settings.volume * 100)}%`;
  elements.duration.value = settings.duration;
  elements.durationOutput.value = `${settings.duration} 秒`;
  elements.durationStat.textContent = `${settings.duration}s`;
  elements.visualMode.value = settings.visualMode;
  elements.count.textContent = settings.triggerCount;
  elements.camera.dataset.facing = settings.facingMode;
  elements.canvas.dataset.facing = settings.facingMode;
  $("#facing-user").setAttribute("aria-pressed", String(settings.facingMode === "user"));
  $("#facing-environment").setAttribute("aria-pressed", String(settings.facingMode === "environment"));
  updateSoundButtons();
}

async function ensureAudioContext() {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") await audioContext.resume();
  return audioContext;
}

function rememberNode(node) {
  activeAudioNodes.push(node);
  node.addEventListener?.("ended", () => {
    activeAudioNodes = activeAudioNodes.filter((item) => item !== node);
  });
}

function scheduleTone(frequency, start, length, volume, type = "sine") {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + length + 0.02);
  rememberNode(oscillator);
}

function playChime() {
  const now = audioContext.currentTime;
  [659.25, 783.99, 1046.5].forEach((frequency, index) => {
    scheduleTone(frequency, now + index * 0.09, 0.55, 0.16 * settings.volume);
  });
}

function findCantoneseVoice() {
  return speechSynthesis.getVoices().find((voice) =>
    voice.lang.replace("_", "-").toLowerCase().startsWith("zh-hk"),
  );
}

function playCantonese(sound) {
  if (!("speechSynthesis" in window)) {
    showToast("這部 iPad 不支援系統語音；可改用輕快音樂。");
    return;
  }
  const voice = findCantoneseVoice();
  if (!voice && speechSynthesis.getVoices().length) {
    showToast("找不到粵語聲音，請在 iPad 設定下載粵語聲音。");
    return;
  }
  playChime();
  const utterance = new SpeechSynthesisUtterance(sound.text);
  utterance.lang = "zh-HK";
  utterance.volume = settings.volume;
  utterance.rate = 0.95;
  utterance.pitch = 1.05;
  if (voice) utterance.voice = voice;
  speechSynthesis.cancel();
  setTimeout(() => speechSynthesis.speak(utterance), 220);
}

function playUpbeatMusic() {
  const melody = [523.25, 659.25, 783.99, 659.25, 698.46, 880, 783.99, 1046.5];
  const bass = [261.63, 349.23, 293.66, 392];
  const start = audioContext.currentTime + 0.03;
  const beat = 0.25;
  const beats = Math.ceil(settings.duration / beat);
  for (let index = 0; index < beats; index += 1) {
    const when = start + index * beat;
    scheduleTone(melody[index % melody.length], when, 0.2, 0.12 * settings.volume, "triangle");
    if (index % 2 === 0) {
      scheduleTone(bass[Math.floor(index / 4) % bass.length], when, 0.42, 0.07 * settings.volume, "sine");
    }
  }
}

function stopAudio() {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  for (const node of activeAudioNodes) {
    try { node.stop(); } catch {}
    node.disconnect();
  }
  activeAudioNodes = [];
}

function startCountdown() {
  let remaining = settings.duration;
  elements.countdown.hidden = false;
  elements.audioWave.hidden = false;
  elements.countdownText.textContent = `${remaining}s`;
  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    remaining -= 1;
    elements.countdownText.textContent = `${Math.max(remaining, 0)}s`;
    if (remaining <= 0) clearInterval(countdownTimer);
  }, 1_000);
}

async function beginPlayback() {
  const sound = SOUND_OPTIONS.find(({ id }) => id === settings.sound) || SOUND_OPTIONS[0];
  await ensureAudioContext();
  settings.triggerCount += 1;
  persistSettings();
  elements.count.textContent = settings.triggerCount;
  elements.stop.disabled = false;
  setStatus("playing", `正在播放：${sound.label}`);
  startCountdown();
  if (sound.kind === "music") playUpbeatMusic();
  else playCantonese(sound);
  clearTimeout(playbackTimer);
  playbackTimer = setTimeout(() => finishPlayback(), settings.duration * 1_000);
}

function finishPlayback(stoppedByUser = false) {
  clearTimeout(playbackTimer);
  clearInterval(countdownTimer);
  stopAudio();
  elements.countdown.hidden = true;
  elements.audioWave.hidden = true;
  elements.stop.disabled = true;
  const next = trigger.finishPlaying(performance.now());
  const readyText = next.ready ? "等待人臉" : "等待人臉離開後再次感應";
  setStatus(detecting ? "ready" : "paused", detecting ? readyText : "感應已暫停");
  if (stoppedByUser) showToast("已中斷播放");
}

function drawFace(landmarks) {
  const { canvas, camera } = elements;
  const context = canvas.getContext("2d");
  if (!camera.videoWidth || !camera.videoHeight) return;
  if (canvas.width !== camera.videoWidth || canvas.height !== camera.videoHeight) {
    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;
  }
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!landmarks || settings.visualMode === "none") return;

  const color = trigger.state === "playing" ? "#4de5b4" : "#6ed8ff";
  const points = landmarks.map((point) => ({ x: point.x * canvas.width, y: point.y * canvas.height }));
  const nose = points[1];
  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = 16;

  if (settings.visualMode === "dot") {
    context.beginPath();
    context.arc(nose.x, nose.y, 13, 0, Math.PI * 2);
    context.fill();
  } else if (settings.visualMode === "hud") {
    context.lineWidth = 2.5;
    context.beginPath();
    context.arc(nose.x, nose.y, 36, 0, Math.PI * 2);
    context.moveTo(nose.x - 50, nose.y);
    context.lineTo(nose.x + 50, nose.y);
    context.moveTo(nose.x, nose.y - 50);
    context.lineTo(nose.x, nose.y + 50);
    context.stroke();
  } else if (settings.visualMode === "box") {
    const xs = points.map(({ x }) => x);
    const ys = points.map(({ y }) => y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    context.lineWidth = 3;
    context.strokeRect(minX - 10, minY - 10, Math.max(...xs) - minX + 20, Math.max(...ys) - minY + 20);
  }
  context.restore();
}

async function handleFaceResults(results) {
  const landmarks = results.multiFaceLandmarks?.[0];
  drawFace(landmarks);
  if (!detecting) return;

  const observation = trigger.observeFace(Boolean(landmarks), performance.now());
  if (observation.triggered) {
    await beginPlayback();
  } else if (trigger.state === "arming") {
    setStatus("ready", "正在確認人臉…");
  } else if (trigger.state === "ready") {
    setStatus("ready", "等待人臉");
  } else if (trigger.state === "wait-for-exit") {
    setStatus("ready", "請離開鏡頭 2 秒");
  }
}

async function requestWakeLock() {
  if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
  } catch {
    showToast("未能保持螢幕常亮，請檢查 iPad 自動鎖定設定。");
  }
}

async function stopCamera() {
  cancelAnimationFrame(frameRequest);
  cameraStarted = false;
  cameraStream?.getTracks().forEach((track) => track.stop());
  cameraStream = undefined;
  elements.camera.srcObject = null;
}

async function processCameraFrame() {
  if (!cameraStarted) return;
  if (
    elements.camera.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    detecting &&
    trigger.state !== "playing" &&
    !processingFrame
  ) {
    processingFrame = true;
    try {
      await faceMesh.send({ image: elements.camera });
    } catch (error) {
      setStatus("error", "人臉模型暫時無法運行");
      showToast(error.message || "請重新啟動感應器");
    } finally {
      processingFrame = false;
    }
  }
  frameRequest = requestAnimationFrame(processCameraFrame);
}

async function startFaceDetection() {
  const localHost = ["localhost", "127.0.0.1"].includes(location.hostname);
  if (!window.isSecureContext && !localHost) throw new Error("相機需要 HTTPS 安全網址");
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("此瀏覽器不支援相機感應");
  if (!window.FaceMesh) throw new Error("人臉模型未能載入");

  await stopCamera();
  faceMesh ||= new window.FaceMesh({
    locateFile: (file) => `./vendor/face_mesh/${file}`,
  });
  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: false,
    minDetectionConfidence: 0.55,
    minTrackingConfidence: 0.55,
  });
  faceMesh.onResults(handleFaceResults);

  cameraStream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: { ideal: settings.facingMode },
      width: { ideal: 960 },
      height: { ideal: 720 },
    },
  });
  elements.camera.srcObject = cameraStream;
  await elements.camera.play();
  cameraStarted = true;
  frameRequest = requestAnimationFrame(processCameraFrame);
  await requestWakeLock();
  setStatus("ready", "等待人臉");
}

async function activateExperience() {
  elements.start.disabled = true;
  elements.startError.hidden = true;
  try {
    await ensureAudioContext();
    trigger.start();
    started = true;
    elements.startOverlay.hidden = true;
    elements.toggle.disabled = false;
    elements.manual.disabled = false;
    setStatus("ready", "等待人臉");
    try {
      await startFaceDetection();
      showToast("相機及聲音已啟動");
    } catch (cameraError) {
      setStatus("error", "相機未能啟動；仍可手動測試");
      showToast(cameraError.message || "請檢查 Safari 相機權限");
    }
  } catch (error) {
    elements.start.disabled = false;
    elements.startError.hidden = false;
    elements.startError.textContent = `無法啟動聲音：${error.message}`;
    trigger.fail();
    setStatus("error", "啟動失敗");
  }
}

elements.start.addEventListener("click", activateExperience);

$$("[data-sound]").forEach((button) => {
  button.addEventListener("click", () => {
    settings.sound = button.dataset.sound;
    persistSettings();
    updateSoundButtons();
    showToast(`已選擇：${elements.selectedLabel.textContent}`);
  });
});

elements.manual.addEventListener("click", async () => {
  if (!started || !detecting || trigger.state === "playing") return;
  if (trigger.forceTrigger(performance.now()).triggered) await beginPlayback();
});

elements.stop.addEventListener("click", () => finishPlayback(true));

elements.toggle.addEventListener("click", () => {
  detecting = !detecting;
  if (!detecting) {
    if (trigger.state === "playing") finishPlayback();
    trigger.pause();
    elements.toggle.textContent = "恢復感應";
    elements.manual.disabled = true;
    setStatus("paused", "感應已暫停");
  } else {
    trigger.resume(performance.now());
    elements.toggle.textContent = "暫停感應";
    elements.manual.disabled = false;
    setStatus("ready", "等待人臉離開後再次感應");
  }
});

elements.volume.addEventListener("input", () => {
  settings.volume = Number(elements.volume.value);
  elements.volumeOutput.value = `${Math.round(settings.volume * 100)}%`;
  persistSettings();
});

elements.duration.addEventListener("input", () => {
  elements.durationOutput.value = `${elements.duration.value} 秒`;
});

$("#facing-user").addEventListener("click", () => {
  settings.facingMode = "user";
  syncSettingsUi();
});

$("#facing-environment").addEventListener("click", () => {
  settings.facingMode = "environment";
  syncSettingsUi();
});

$("#btn-settings").addEventListener("click", () => elements.settingsDialog.showModal());
$("#btn-save-settings").addEventListener("click", async () => {
  settings.duration = Number(elements.duration.value);
  settings.visualMode = elements.visualMode.value;
  persistSettings();
  syncSettingsUi();
  showToast("設定已儲存");
  if (cameraStarted) {
    try {
      await startFaceDetection();
    } catch (error) {
      setStatus("error", "鏡頭切換失敗");
      showToast(error.message || "請檢查相機權限");
    }
  }
});

$("#btn-fullscreen").addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch {
    showToast("此模式不支援全螢幕，可加入主畫面使用。");
  }
});

function renderQrCode() {
  elements.qrCode.replaceChildren();
  elements.shareUrl.textContent = CANONICAL_URL;
  if (window.QRCode) {
    new window.QRCode(elements.qrCode, {
      text: CANONICAL_URL,
      width: 200,
      height: 200,
      colorDark: "#071c1c",
      colorLight: "#ffffff",
      correctLevel: window.QRCode.CorrectLevel.M,
    });
  } else {
    elements.qrCode.textContent = "QR Code 載入中，請稍後再試。";
  }
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    elements.offlineStatus.textContent = "不支援";
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("./service-worker.js");
    await navigator.serviceWorker.ready;
    elements.offlineStatus.textContent = "可離線";

    if (registration.waiting) showToast("新版已準備，下次開啟時套用。");
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          showToast("新版已準備，下次開啟時套用。");
        }
      });
    });
  } catch {
    elements.offlineStatus.textContent = navigator.onLine ? "未完成" : "離線中";
  }
}

$("#btn-share").addEventListener("click", () => {
  renderQrCode();
  elements.shareDialog.showModal();
});
$("#btn-close-share").addEventListener("click", () => elements.shareDialog.close());
$("#btn-copy-url").addEventListener("click", async () => {
  await navigator.clipboard.writeText(CANONICAL_URL);
  showToast("網址已複製");
});

syncSettingsUi();
registerServiceWorker();

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && started) requestWakeLock();
});

window.addEventListener("pagehide", () => {
  wakeLock?.release?.();
  stopCamera();
});

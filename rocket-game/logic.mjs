export const TARGET_ALTITUDE = 100;
export const LIFT_RATE = 28;

export function nextAltitude(altitude, thrusting, dt) {
  if (!thrusting) return clamp(altitude);
  return clamp(altitude + LIFT_RATE * dt);
}

export function reachedSpace(altitude) {
  return altitude >= TARGET_ALTITUDE;
}

function clamp(value) {
  return Math.max(0, Math.min(TARGET_ALTITUDE, value));
}

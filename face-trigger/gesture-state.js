export function createWaveDetector({ windowMs = 900, jitter = 0.025, reversalTravel = 0.08, totalTravel = 0.4 } = {}) {
  let startedAt;
  let lastX;
  let direction = 0;
  let segmentStart;
  let reversed = false;
  let travel = 0;

  function reset(x, now) {
    startedAt = now;
    lastX = x;
    direction = 0;
    segmentStart = x;
    reversed = false;
    travel = 0;
  }

  return {
    reset() {
      startedAt = undefined;
      lastX = undefined;
    },

    observe(x, now) {
      if (!Number.isFinite(x)) {
        this.reset();
        return false;
      }
      if (startedAt === undefined || now - startedAt > windowMs) {
        reset(x, now);
        return false;
      }

      const delta = x - lastX;
      if (Math.abs(delta) < jitter) return false;
      const nextDirection = Math.sign(delta);
      travel += Math.abs(delta);

      if (direction && nextDirection !== direction) {
        if (Math.abs(lastX - segmentStart) >= reversalTravel) reversed = true;
        segmentStart = lastX;
      }
      direction = nextDirection;
      lastX = x;

      if (reversed && travel >= totalTravel) {
        reset(x, now);
        return true;
      }
      return false;
    },
  };
}

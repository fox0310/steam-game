import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TARGET_ALTITUDE, nextAltitude, reachedSpace } from "./logic.mjs";

assert.equal(nextAltitude(10, false, 1), 10);
assert.equal(nextAltitude(90, true, 1), TARGET_ALTITUDE);
assert.equal(reachedSpace(TARGET_ALTITUDE), true);
assert.equal(reachedSpace(TARGET_ALTITUDE - 1), false);
for (const file of ["long-march-5-rocket.glb", "proton-rocket-launchpad.glb"]) {
  assert.equal(readFileSync(new URL(`./assets/models/${file}`, import.meta.url), { encoding: "ascii", flag: "r" }).slice(0, 4), "glTF");
}

console.log("rocket self-check passed");

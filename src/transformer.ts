import { space, TARGETS } from ".";

function lerp(a: number, b: number, t: number): number {
  return (1 - t) * a + t * b;
}

function clamp(a: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, a));
}

function saturate(a: number): number {
  return clamp(a, 0, 1);
}

function transformAccumDelta(input: number): number {
  let accum = input;
  for (const target of TARGETS) {
    let delta = target.position.$subtract(space.center);
    let distance = delta.magnitude();
    let anglePosition = Math.atan2(delta.y, delta.x);
    let angleSize = Math.asin(target.radius / distance);

    const factor = saturate(Math.abs(input - anglePosition) / angleSize);
    const value = lerp(anglePosition, input, factor);
    const d = value - input;
    accum += d;
  }
  return accum;
}

export default function transform(input: number): number {
  return transformAccumDelta(input);
}

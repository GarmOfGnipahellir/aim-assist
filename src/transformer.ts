import { space, targets } from ".";
import { AngleTarget } from "./target";

let sin = Math.sin;
let abs = Math.abs;
let floor = Math.floor;
let pow = Math.pow;
let min = Math.min;
let max = Math.max;
let PI = Math.PI;

function lerp(a: number, b: number, t: number): number {
  return (1 - t) * a + t * b;
}

function clamp(a: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, a));
}

function saturate(a: number): number {
  return clamp(a, 0, 1);
}

function transformAccumDelta(input: number, targets: AngleTarget[]): number {
  let accum = input;
  for (const target of targets) {
    const factor = saturate(Math.abs(input - target.position) / target.radius);
    const value = lerp(target.position, input, factor);
    const delta = value - input;
    accum += delta;
  }
  return accum;
}

function transformWeightedAvarage(
  input: number,
  targets: AngleTarget[]
): number {
  let weights: [number, number][] = [];
  for (const target of targets) {
    const weight =
      1 - saturate(Math.abs(input - target.position) / target.radius);
    const delta = target.position - input;
    let neighbors = 0;
    for (const target2 of targets) {
      if (target === target2) {
        neighbors += 1;
        continue;
      }
      if (
        Math.abs(target.position - target2.position) <
        target.radius + target2.radius
      ) {
        neighbors += 1;
      }
    }
    if (weight > 0) {
      weights.push([weight * delta, neighbors]);
    }
  }
  let sum = 0;
  let num = 0;
  for (const [weight, neighbors] of weights) {
    num = Math.max(neighbors);
    sum += weight;
  }
  if (num > 0) {
    return input + sum / num;
  }
  return input;
}

function transformSinCombiner(input: number, targets: AngleTarget[]): number {
  function base(x: number): number {
    x += 0.5;
    let mask = saturate(1 - abs(floor(x)));
    return (sin((x - 0.25) * PI * 2) * 0.5 + 0.5) * mask;
  }

  let x = input;

  let rawAlphas: number[] = [];
  for (const target of targets) {
    rawAlphas.push(1 - pow(1 - base((x - target.position) / (target.radius * 2)), 1));
  }

  let alphas: number[] = [];
  for (let i = 0; i < rawAlphas.length; i++) {
    let alpha = rawAlphas[i];
    for (let j = 0; j < rawAlphas.length; j++) {
      if (i === j) continue;
      alpha -= min(alpha, rawAlphas[j]);
    }
    alphas.push(alpha);
  }

  let y = x;
  for (let i = 0; i < alphas.length; i++) {
    y += lerp(x, targets[i].position, alphas[i]) - x;
  }

  return y;
}

export default function transform(
  input: number,
  targets: AngleTarget[]
): number {
  return transformSinCombiner(input, targets);
}

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

export function weight(input: number, target: AngleTarget): number {
  let x = (input - target.position) / (target.radius * 8) + 0.5;
  let mask = saturate(1 - abs(floor(x)));
  return (sin((x - 0.25) * PI * 2) * 0.5 + 0.5) * mask;
}

export function weights(input: number, targets: AngleTarget[]): number[] {
  return targets.map((target) => {
    return weight(input, target);
  });
}

export function weightsSum(input: number, targets: AngleTarget[]): number {
  return weights(input, targets).reduce((prev, cur) => prev + cur, 0);
}

export function offset(
  input: number,
  target: AngleTarget,
  weight: number
): number {
  let delta = target.position - input;
  return delta * weight;
}

export function offsets(
  input: number,
  targets: AngleTarget[],
  weights: number[]
): number[] {
  return targets.map((target, i) => {
    return offset(input, target, weights[i]);
  });
}

export function offsetsSum(
  input: number,
  targets: AngleTarget[],
  weights: number[]
): number {
  return offsets(input, targets, weights).reduce((prev, cur) => prev + cur, 0);
}

export function transform(input: number, targets: AngleTarget[]): number {
  let ws = weights(input, targets);
  let os = offsetsSum(input, targets, ws);
  return input + os;
}

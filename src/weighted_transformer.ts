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

export class WeightedTransformer {
  public targets: AngleTarget[];

  constructor(targets: AngleTarget[]) {
    this.targets = targets.sort((a, b) => b.distance - a.distance);
  }

  occlusionFactor(target: AngleTarget): number {
    let result = 0;
    let overlaps: { start: number; end: number }[] = [];
    for (const other of this.targets) {
      if (other.distance >= target.distance) {
        continue;
      }

      if (
        (target.start() > other.start() && target.start() < other.end()) ||
        (target.end() > other.start() && target.end() < other.end())
      ) {
        let maxStart = max(target.start(), other.start());
        let minEnd = min(target.end(), other.end());
        overlaps.push({ start: maxStart, end: minEnd });
      }
    }
    /*
    for (let i = 0; i < overlaps.length; i++) {
      for (let j = 0; j < overlaps.length; j++) {
        if (i == j) {
          continue;
        }
        let overlap1 = overlaps[i];
        let overlap2 = overlaps[j];

        if (
          (overlap1.start > overlap2.start && overlap1.start < overlap2.end) ||
          (overlap1.end > overlap2.start && overlap1.end < overlap2.end)
        ) {
          let minStart = min(overlap1.start, overlap2.start);
          let maxEnd = max(overlap1.end, overlap2.end);
          overlaps.push({ start: minStart, end: maxEnd });
          // TODO: remove combined overlaps
          // or just accumulate occlusion
        }
      }
    }
    */
    for (const overlap of overlaps) {
      result += (overlap.end - overlap.start) / (target.radius * 2);
    }
    return result;
  }

  weights(input: number): number[] {
    let ws = weights(input, this.targets);
    ws = ws.map((w, i) => w * (1 - this.occlusionFactor(this.targets[i])));
    ws = ws.map((w) => saturate(w));
    return ws;
  }

  transform(input: number): number {
    let ws = this.weights(input);
    let os = offsetsSum(input, this.targets, ws);
    return input + os;
  }
}
